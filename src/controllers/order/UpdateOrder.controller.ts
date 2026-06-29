import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogFailureReasonEnum, ActionTypeEnum, AdminsEntity, BadRequestError, BaseError, BrandsEntity, DeliveryAddressTypeEnum, LanguageEnum, ManagerStatsEntity, NotFoundError, OrderEntity, OrderItemEntity, OrderStatusEnum, PaymentTypeEnum, ProductsAwaitingUserReviewsEntity, ProductsAwaitingUserReviewsStatusEnum, ProductStatsEntity, ProductStatusEnum, Repository, RolesEnum, SapOrderStatusEnum, StoreCashbackTypeEnum, StoreOrderEntity, StoresEntity, UserCashbackEntity, UserCashbackLogEntity, UserCashbackLogModel, UserCashbackLogSourceEnum, UserCashbackLogType, UserStatsEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { UpdateOrderParams } from '../../infrastructure/params/UpdateOrder.params';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { OrderChangeLogUseCase } from '../../usecases';
import { ActionLogService, ClickFiscalQueueService, OctoFiscalQueueService, OrderDetailTGBotSenderParamsInterface, OrderOperationQueueService, OrderQueueService, TelegramBotMessageSender, UzumSubmitFiscalQueueService } from '../../services';

@prefix('/orders')
export default class UpdateOrderController {
  @request('put', '/{orderId}')
  @summary('Order update')
  @security([])
  @tags(['Orders'])
  @path({ orderId: { type: 'string', required: true } })
  @body((UpdateOrderParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateOrderParams;

    try {
      idParams = await new IdParams({ id: context.params.orderId }).validate();
      params = await new UpdateOrderParams(context.request.body).validate();

    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const orderId = new Types.ObjectId(idParams.id);
      const admin:AdminsEntity = context.admin
      
      const found = await Repository.Orders().getById(orderId);
      const before = await Repository.Orders().findOneRaw(orderId);
      if (!found) {
        throw new Error('Order not found');
      }

      const previousStatus = found.getStatus();
      console.log('+- role:',admin.getRole());

      const role = admin.getRole();

      if (!(role instanceof Types.ObjectId) && role?.getCode() !== RolesEnum.SUPER_ADMIN && previousStatus === OrderStatusEnum.DELIVERED) {
        throw new BaseError('You cannot cancel order');
      }
      if (params.status === OrderStatusEnum.RETURNED && previousStatus !== OrderStatusEnum.DELIVERED) {
        throw new BadRequestError('Only delivered orders can be returned');
      }
      // if (admin.getRole()!== RolesEnum.SUPER_ADMIN && previousStatus === OrderStatusEnum.DELIVERED) {
      //   throw new BaseError('You cannot update the order')
      // }

      let newStatus: OrderStatusEnum;     
      if (params.status) {
        newStatus = params.status as OrderStatusEnum; 
        if (newStatus !== previousStatus) {
          found.buildStatus(newStatus);                  
        }
      }
      // Todo that should recieve only it editted
      if (params.paymentType) {
        if (params.paymentType !== found.getPaymentType()) {
          if (params.paymentType == PaymentTypeEnum.CASH) {
            newStatus = OrderStatusEnum.PROCESSING;
            found.buildStatus(newStatus)
          };
          if (params.paymentType == PaymentTypeEnum.CARD || params.paymentType == PaymentTypeEnum.CLICK || params.paymentType == PaymentTypeEnum.CLICK_QR) {
            newStatus = OrderStatusEnum.PENDING;
            found.buildStatus(newStatus);
          };
          found.buildPaymentType(params.paymentType)
        }
      };

      if (params.products?.length > 0) {
        // Step 1: Get all product IDs (old + new)
        const oldProductIds = found.getItems().map(i => new Types.ObjectId(i.getProductId()));
        const newProductIds = params.products.map(i => new Types.ObjectId(i.id));
        const allProductIds = [...new Set([...oldProductIds, ...newProductIds])];
      
        // Fetch all products at once
        const products = await Repository.Products().list({}, { _id: { $in: allProductIds } });
        const productMap = new Map(products.map(p => [p.getId().toHexString(), p]));
      
        // Step 2: Restore stock from old order items
        for (const item of found.getItems()) {
          const product = productMap.get(item.getProductId());
          if (!product) continue;
          console.log('+- bef add count',product.getCount());
          if (product.getIsPreOrder()) continue;
          product.buildCount(product.getCount() + item.getQuantity());
          console.log('+- aft add count',product.getCount());

          if (product.getCount() > product.getMinimumCount()) {
            if (product.getCount() > 10) {
              product.buildStatus(ProductStatusEnum.IN_STOCK);              
            } else {
              product.buildStatus(ProductStatusEnum.LOW_STOCK);              
            }
          }
        }
      
        // Step 3 + 4: Validate and subtract new quantities
        const modifiedItems = [];
        let totalAmount = 0
        let discountAmount = 0
        let subTotal = 0 
        let deliveryPrice = params.deliveryPrice ?? found.getDeliveryPrice() ?? 0;
        
        totalAmount += deliveryPrice;
        subTotal += deliveryPrice;
        let storeOrdersMap: Map<string, StoreOrderEntity> = new Map()

        for (const item of params.products) {
          const product = productMap.get(item.id);
          if (!product) throw new NotFoundError('Product');
          
          let isItemPreOrder = product.getIsPreOrder() ?? false
          if (!isItemPreOrder) {          
            if (product.getCount() < item.quantity) {
              throw new NotFoundError('Product not enough');
            };
          }           
          
          const store = product.getStore() as StoresEntity
          let isDiscounted = false
          let price = item.price
          let appliedDiscount = item.discount_amount ?? 0
          let discountPrice = price - appliedDiscount // will be deleted soon
          if (appliedDiscount > 0) {
            isDiscounted = true
          }
          const finalPrice = price - appliedDiscount
          const quantity = item.quantity
          let itemDiscountAmount = appliedDiscount * quantity
          let itemTotalAmount = finalPrice * quantity
          let itemSubTotal = price * quantity
          totalAmount += itemTotalAmount
          subTotal += itemSubTotal
          discountAmount += itemDiscountAmount
      
          // Subtract stock
          if (!product.getIsPreOrder()) {
            product.buildCount(product.getCount() - item.quantity);
            if (product.getCount() <= product.getMinimumCount()) {
              product.buildStatus(ProductStatusEnum.OUT_OF_STOCK);
            } else {
              if (product.getCount() > 10) {
                product.buildStatus(ProductStatusEnum.IN_STOCK)
              } else {
                product.buildStatus(ProductStatusEnum.LOW_STOCK)
              }
            }
          }

          const storeCashbackConfig = store.getCashbackConfig()
          let cashbackAmount = 0;
          let cashbackPercent = 0;
          let cashbackType:StoreCashbackTypeEnum | null = null;
          if (storeCashbackConfig.getEnabled()) {
            cashbackType = storeCashbackConfig.getType();
            cashbackPercent = cashbackType == StoreCashbackTypeEnum.GENERAL ?
              storeCashbackConfig.getPercent() :
              cashbackType == StoreCashbackTypeEnum.PER_PRODUCT ?
                product.getCashbackPercent() : 0;
            cashbackAmount = (finalPrice * quantity * cashbackPercent) / 100
            const includeDiscounted = storeCashbackConfig.getIncludeDiscounted()
            if (isDiscounted) {
              if (!includeDiscounted) {
                cashbackAmount = 0
              }
            }                      
          }
          const result = new OrderItemEntity()
            .buildProductId(product.getId().toHexString())
            .buildStoreId(store.getId().toHexString())
            .buildAttachments(product.getAttachments())
            .buildProductName(product.getName()?.convertToSchema())
            .buildIKPU(product?.getProductInfo()?.getIKPU())
            .buildPackageCode(product?.getProductInfo()?.getPackageCode())
            .buildBrand((product.getProductInfo().getBrand() as BrandsEntity)?.getTitle()?.getByLang(context.lang || LanguageEnum.UZ))
            .buildBarcode(product?.getProductInfo()?.getBarcode())
            .buildSkuCode(product?.getProductInfo()?.getSKUCode())
            .buildQuantity(item.quantity)
            .buildPrice(price)
            .buildDiscountAmount(appliedDiscount)
            .buildDiscountPrice(discountPrice)
            .buildDiscountPercent(item.discount_percent)
            .buildFinalPrice(finalPrice)
            .buildCashbackEarned(cashbackAmount)
            .buildCashbackPercent(cashbackPercent)
            .buildHasDiscount(isDiscounted)
            .buildIsPreOrder(isItemPreOrder)
            .buildItemCode(product?.getItemCode())
            .buildWarehouseCode(product?.getCountFromEshop() ? 'eshop' : '01')
          
          
            let storeOrderEntity = storeOrdersMap.get(store.getId().toHexString())
            console.log('+ get',storeOrderEntity,'-',store.getId().toHexString());
            
            if (!storeOrderEntity) {
              console.log('no');      
              storeOrderEntity = await Repository.StoreOrders().getByOrderAndStore(found.getId(),store.getId())
              if (storeOrderEntity) {
                storeOrderEntity
                  .buildTotalAmount(itemTotalAmount)              
                  .buildDiscountAmount(itemDiscountAmount)              
                  .buildSubTotal(itemSubTotal)              
                  .buildCashbackEarned(cashbackAmount)
                  .buildCashbackType(cashbackType)
                  .buildCashbackPercent(cashbackPercent)
                  .buildItems([result.convertToSchema()])
                  .buildIsPreOrder(isItemPreOrder);
                  if (isItemPreOrder) {
                    storeOrderEntity.buildIsPreOrder(isItemPreOrder);
                    found.buildIsPreOrder(isItemPreOrder);
                  }
                storeOrdersMap.set(store.getId().toHexString(),storeOrderEntity)

              } else {
                let newStoreOrderEntity = new StoreOrderEntity()
                newStoreOrderEntity.buildStoreId(store.getId())
                  .buildOrderId(found.getId())
                  .buildSellerId(store.getSeller() as Types.ObjectId)
                  .buildStoreId(store.getId())
                  .buildStoreName(store.getName())
                  .buildStoreAvatar(store.getAvatar())
                  .buildTotalAmount(itemTotalAmount)
                  .buildDiscountAmount(itemDiscountAmount)
                  .buildSubTotal(itemSubTotal)
                  .buildCashbackEarned(cashbackAmount)
                  .buildCashbackType(cashbackType)
                  .buildCashbackPercent(cashbackPercent)
                  .buildItems([result.convertToSchema()])
                  .buildUserData(found.getUserData().convertToSchema())
                  .buildIsPreOrder(isItemPreOrder)
                found.buildIsPreOrder(isItemPreOrder);
                storeOrdersMap.set(store.getId().toHexString(), newStoreOrderEntity);
              }              
            } else {
              console.log('yes');
              itemTotalAmount += storeOrderEntity.getTotalAmount()
              itemDiscountAmount += storeOrderEntity.getDiscountAmount()
              itemSubTotal += storeOrderEntity.getSubTotal()
              cashbackAmount += storeOrderEntity.getCashbackEarned()
              storeOrderEntity
                .buildTotalAmount(itemTotalAmount)
                .buildDiscountAmount(itemDiscountAmount)
                .buildSubTotal(itemSubTotal)
                .buildCashbackEarned(cashbackAmount)
                .buildIsPreOrder(isItemPreOrder)
                .buildItems([...storeOrderEntity.getItems().map(item => item.convertToSchema()), result.convertToSchema()])
                if (isItemPreOrder) {
                  storeOrderEntity.buildIsPreOrder(isItemPreOrder);
                  found.buildIsPreOrder(isItemPreOrder);
                }
              console.log('bef upt stoor', storeOrderEntity);              
          };
      
          found.buildTotalAmount(totalAmount);
          found.buildDiscountAmount(discountAmount);
          found.buildSubTotal(subTotal);
          modifiedItems.push(result);
          const sapOrderInfo = found.getSapOrderInfo()
          if (sapOrderInfo) {
            sapOrderInfo.status = SapOrderStatusEnum.READY_TO_RESERVE;
            found.buildSapOrderInfo(sapOrderInfo);
          }
        }

        const promoCodeData = found.getPromoCodeData()
        if (promoCodeData) {
          totalAmount = totalAmount - promoCodeData?.getDiscountAmount()         
        }
      
        // Step 5: Save new order items
        found.buildItems(modifiedItems.map(item => item.convertToSchema()));
        
        const storeOrders = []
        let totalCashbackSpent = 0;
      for (let [store, order] of storeOrdersMap) {
        console.log('+-in map',store,order);
        totalCashbackSpent += order.getPayedFromCashback() ?? 0
        storeOrders.push(order.convertToSchema())
      }
        console.log("totalcashabck spent",totalCashbackSpent,totalAmount,subTotal,discountAmount,found);
        
        totalAmount -= totalCashbackSpent
      if (totalAmount !== params.totalAmount) {
        throw new BadRequestError('Total amount wrong')
      }
        
      console.log('+-',storeOrders);
      await Promise.all(storeOrders.map(async (order) => {
        const cashbackAmount = order.cashbackEarned
        const storeId = order.storeId
        const userId = found.getUserData().getId()
        if (!order._id) {
          await Repository.StoreOrders().create(new StoreOrderEntity().convertToEntity(order))          
        } else {
          
          await Repository.StoreOrders().update(new StoreOrderEntity().convertToEntity(order))
        }
        if (cashbackAmount > 0) {
          let userCashback = await Repository.UserCashback().getByUserAndStore(userId, storeId)
  
          console.log('+-+',userCashback);
          if (userCashback) {
            const userCashbackLog = await Repository.UserCashbackLog().getByOrderAndStoreOrder(found.getId(), new Types.ObjectId(order._id))
            if (userCashbackLog) {
              const amountToSubtract = userCashbackLog.getAmount()
              userCashbackLog
              .buildAmount(cashbackAmount)
              await Repository.UserCashbackLog().update(userCashbackLog)    
              userCashback.buildCashbackAmount(userCashback.getCashbackAmount()-amountToSubtract+cashbackAmount)
              await Repository.UserCashback().update(userCashback)
            }
          }
        }
      }))

      const existingStoreOrders = await Repository.StoreOrders().list({}, { orderId: found.getId() }, {});


      const remainingStoreIds = new Set<string>(
       modifiedItems.map((item) => (item as any).getStoreId ? (item as any).getStoreId() : (item as any)._storeId)
      );


      const toDelete = existingStoreOrders.filter((so) => {
      const storeIdStr = so.getStoreId().toHexString();
      return !remainingStoreIds.has(storeIdStr);
      });

      await Promise.all(toDelete.map((so) => Repository.StoreOrders().deleteById(so.getId())));

        found.buildStoreOrders(storeOrders)
        
        await Promise.all(products.map(p => Repository.Products().update(p)));
      }
      
      if (params.manager) {        
        const manager = await Repository.Managers().getById(new Types.ObjectId(params.manager))
        if (!manager) {
          throw new NotFoundError('Manager')
        }
        
        console.log('+-= in update manger',manager);
        found.buildManager(manager.getId());
        found.buildManagerName(manager.getName());
      } else if(found.getManager() && found.getManagerName()) {
        console.log('+-= in update manger null');

        found.buildManager(null)
        found.buildManagerName(null)
      }

      if (params.comment) found.buildComment(params.comment);
      if (params.deliveryAddressType) found.buildDeliveryAddressType(params.deliveryAddressType);
      if (params.address) found.buildShippingAddress(params.address);
      if (params.totalAmount!==undefined) found.buildTotalAmount(params.totalAmount);
      if (params.deliveryPrice !== undefined) found.buildDeliveryPrice(params.deliveryPrice);
      
      if (params.urgentDelivery !==undefined) found.buildUrgentDelivery(params.urgentDelivery);
      // if(params.paymentData) found.buildPaymentData(params.paymentData);

      await InvalidateRedisCache.execute('carousel:list:')
      await InvalidateRedisCache.execute('carousel:count')      
      await InvalidateRedisCache.execute('special-event:list:')
      await InvalidateRedisCache.execute('special-event:count')

      if (newStatus === OrderStatusEnum.DELIVERED) {

        if(found.getPaymentType() === PaymentTypeEnum.CLICK || found.getPaymentType() === PaymentTypeEnum.CLICK_QR) {
          await ClickFiscalQueueService.getInstance().addSubmitOfdDataJob(found.getOrderCode());
          console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
        }

        //UZUM FISCALIZATION UCHUN
        // if(found.getPaymentType() === PaymentTypeEnum.UZUM) {
        //   await UzumSubmitFiscalQueueService.getInstance().addSubmitOfdDataJob(found.getOrderCode());
        //   console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
        // }
        if(found.getPaymentType() === PaymentTypeEnum.CARD) {
          await OctoFiscalQueueService.getInstance().submitReceiptJob(found.getOrderCode());
          console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
        }

        // Fetch user once
        const userId = found.getUser() as Types.ObjectId;
        const user = userId ? await Repository.Users().getById(userId) : null;
        const manager = found.getManager() ? await Repository.Managers().getById(found.getManager() as Types.ObjectId) : null;
      
        // Group product quantities by productId (to avoid duplicate lookups)
        const productQuantities: Record<string, number> = {};
        for (const item of found.getItems()) {
          const productId = item.getProductId();
          productQuantities[productId] = (productQuantities[productId] || 0) + item.getQuantity();
        }
      
        // Update all products in parallel
        await Promise.all(
          Object.entries(productQuantities).map(async ([productId, totalQuantity]) => {
            const product = await Repository.Products().getById(new Types.ObjectId(productId));
            if (product) {
              const soldCount = (product.getProductStats()?.getSold() || 0) + totalQuantity;
              let productStats = product.getProductStats() ?? new ProductStatsEntity();
              productStats.buildSold(soldCount);
              product.buildProductStats(productStats.convertToSchema());
              await Repository.Products().update(product);
            }
          })
        );
      
        // Update user stats once
        if (user) {
          const prevStats = user.getUserStats() ?? new UserStatsEntity()

              prevStats.buildOrdersCount((prevStats?.getOrdersCount() ?? 0) + 1)
            .buildCompletedOrdersCount((prevStats?.getCompletedOrdersCount() ?? 0) + 1)
            .buildCompletedOrdersSum((prevStats?.getCompletedOrdersSum() ?? 0) + (found.getTotalAmount() ?? 0))
            .buildLastOrderAt(new Date())
            .buildLastOrder(found.getId());
          user.buildUserStats(prevStats.convertToSchema());
          await Repository.Users().update(user);
        }

        if (manager) {
          let managerStats = manager.getStats() ?? new ManagerStatsEntity();
          const ordersCount = (manager.getStats()?.getOrdersCount() ?? 0) + 1;
          const ordersAmount = (manager.getStats()?.getOrdersAmount() ?? 0) + found.getTotalAmount();
          managerStats.buildOrdersCount(ordersCount);     
          managerStats.buildOrdersAmount(ordersAmount);
          manager.buildStats(managerStats.convertToSchema());
          await Repository.Managers().update(manager);
        }
        await OrderQueueService.getInstance().publishStoreStatsOrderToQueue(found.getId().toString());
        const storeOrders = await Repository.StoreOrders().list({}, { orderId: found.getId() }, {} );
        let totalCashbackEarned = 0;
        for (const storeOrder of storeOrders) {
          if(storeOrder.getIsCashbackAdded()) continue;
          let cashbackAmount = storeOrder.getCashbackEarned()
          let cashbackPercent = storeOrder.getCashbackPercent()
          const storeId = storeOrder.getStoreId()
          const store = await Repository.Stores().getById(storeId)
          const cashbackConfig = store.getCashbackConfig()
          const userId = found.getUserData().getId()
          let amountToCalculateCashback =0

          /**Calculate cashback amount based on order amount: if store cashback type is based on order amount*/
          if (storeOrder.getCashbackType() == StoreCashbackTypeEnum.BASED_ON_ORDER_AMOUNT) { 
            // identify how much amount available to calculate cashback
            const items = storeOrder.getItems()
            items.forEach((i) => {
              // it gets zero(0) if cashbackConfig's includeDiscounted field is false and item purchased with discount 
              const itemPrice = cashbackConfig.getIncludeDiscounted() ? i.getFinalPrice() : i.getHasDiscount() ? 0 : i.getPrice();
              amountToCalculateCashback += itemPrice * i.getQuantity()
            })

            console.log("1. amountToCalculateCashback",amountToCalculateCashback);
            if (amountToCalculateCashback >= storeOrder.getPayedFromCashback()) {
              amountToCalculateCashback -= storeOrder.getPayedFromCashback() ?? 0;              
            }
            console.log("2. amountToCalculateCashback",amountToCalculateCashback);

            const storeCashbackRule = await Repository.StoreCashbackRules().findSuitableRule(storeId, amountToCalculateCashback);
            if (storeCashbackRule) {              
              cashbackPercent = amountToCalculateCashback > storeCashbackRule.getAmount() ? storeCashbackRule.getUpperPercent() : storeCashbackRule.getLowerPercent()
              cashbackAmount = (amountToCalculateCashback * cashbackPercent) / 100
            } else {
              cashbackAmount = 0
              cashbackPercent = 0
            }
             
          }
          console.log("3. amountToCalculateCashback",amountToCalculateCashback);

          
          if (cashbackAmount > 0) {
          let userCashback = await Repository.UserCashback().getByUserAndStore(userId, storeId)
  
          console.log('+-+',userCashback);
          if (!userCashback) {
            userCashback = new UserCashbackEntity()
              .buildUser(userId)
              .buildStore(storeId)
              .buildCashbackAmount(cashbackAmount) 
              await Repository.UserCashback().create(userCashback)
            
          } else {
            userCashback.buildCashbackAmount(userCashback.getCashbackAmount()+cashbackAmount)
            await Repository.UserCashback().update(userCashback)
          }
          const userCashbackLog = new UserCashbackLogEntity()
            .buildAmount(cashbackAmount)
            .buildStore(storeId)
            .buildType(UserCashbackLogType.EARNED)
            .buildSource(UserCashbackLogSourceEnum.ORDER)
            .buildCashbackType(storeOrder.getCashbackType())
            .buildCashbackPercent(storeOrder.getCashbackPercent())
            .buildOrder(found.getId())
            .buildStoreOrder(storeOrder.getId())
            .buildUser(userId)
          
          await Repository.UserCashbackLog().create(userCashbackLog)   
          /** Send notificaiton about user's getting cashback. */
          try {
              const notificationService = new NotificationTemplateService();
              await notificationService.sendCashbackNotification(
                found.getUser().toString(),
                found.getId().toString(),
                cashbackAmount,
                storeOrder.getStoreName()
              );
          } catch (notificationError) {
            console.error('Failed to send order status notification:', notificationError);
            // Don't fail the main operation if notification fails
          }
          };
          totalCashbackEarned += cashbackAmount
          storeOrder.buildCashbackEarned(cashbackAmount)
          storeOrder.buildCashbackPercent(cashbackPercent)
          storeOrder.buildIsCashbackAdded(true) // mark as cashback added
          await Repository.StoreOrders().update(storeOrder)
        }
        // Mark delivered timestamp4
        found.buildDeliveredAt(new Date());
        found.buildCashbackEarned(totalCashbackEarned)
      }    

      
       if (previousStatus !== newStatus) {

        switch (newStatus) {
          case OrderStatusEnum.PENDING:
            if (!found.getPendingAt?.()) found.buildPendingAt?.(new Date());
            break;

          case OrderStatusEnum.PROCESSING:
            if (!found.getProcessingAt?.()) found.buildProcessingAt?.(new Date());
            break;

          case OrderStatusEnum.CONFIRMED:
            if (!found.getConfirmedAt?.()) found.buildConfirmedAt?.(new Date());
            break;

          case OrderStatusEnum.PREPARING:
            if (!found.getPreparingAt?.()) found.buildPreparingAt?.(new Date());
            break;

          case OrderStatusEnum.READY_TO_DELIVER:
            if (!found.getReadyToDeliverAt?.()) found.buildReadyToDeliverAt?.(new Date());
            break;

          case OrderStatusEnum.READY_TO_PICKUP:
            if (!found.getReadyToPickupAt?.()) found.buildReadyToPickupAt?.(new Date());
            break;

          case OrderStatusEnum.SHIPPED:
            if (!found.getShippedAt?.()) found.buildShippedAt?.(new Date());
            break;

          case OrderStatusEnum.DELIVERED:
            if (!found.getDeliveredAt?.()) {
              if(found.getPaymentType() === PaymentTypeEnum.CLICK || found.getPaymentType() === PaymentTypeEnum.CLICK_QR) {
              await ClickFiscalQueueService.getInstance().addSubmitOfdDataJob(found.getOrderCode());
              console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
              }

              //UZUM FISCALIZATION UCHUN
              // if (found.getPaymentType() === PaymentTypeEnum.UZUM) {
              //   await UzumSubmitFiscalQueueService.getInstance().addSubmitOfdDataJob(found.getOrderCode());
              //   console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
              // }
              
              if (found.getPaymentType() === PaymentTypeEnum.CARD) {
                await OctoFiscalQueueService.getInstance().submitReceiptJob(found.getOrderCode());
                console.log(`Delivered order ${found.getOrderCode()} added to fiscal queue`);
              }
              found.buildDeliveredAt?.(new Date());
            }
            break;

          case OrderStatusEnum.CANCELLED:
            if (!found.getCancelledAt?.()) found.buildCancelledAt?.(new Date());
            break;
        }
      }
            
      // order log
      await OrderChangeLogUseCase.execute(admin, orderId, found.convertToSchema());

      console.log('update -=>',found);
      
      const after = await Repository.Orders().update(found);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Order',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });

      /** Working with queue */
      // const sapOrderInfo = found.getSapOrderInfo()
      // if (newStatus === OrderStatusEnum.CONFIRMED && sapOrderInfo && sapOrderInfo.status === SapOrderStatusEnum.READY_TO_RESERVE) {
      //   const orderQueue = OrderQueueService.getInstance();
      //   await orderQueue.publishUpdatedOrderToQueue(found.getId().toString());   
      // }

      if (newStatus === OrderStatusEnum.DELIVERED || newStatus === OrderStatusEnum.READY_TO_DELIVER) { 
        // const orderQueue = OrderQueueService.getInstance();
        // await orderQueue.publishInvoiceOrderToQueue(found.getId().toString());  
        const storeOrders = await Repository.StoreOrders().list({}, { orderId: found.getId() }, {} );
        for (let storeOrder of storeOrders) {
          const items = storeOrder.getItems();
          console.log('+- storeOrder',storeOrder.getId(),storeOrder.getItems().length);
          
          for (let item of items) {            
            const productAwaitingUserReview = new ProductsAwaitingUserReviewsEntity()
            productAwaitingUserReview.buildOrder(found.getId() as Types.ObjectId)
            productAwaitingUserReview.buildUser(found.getUser() as Types.ObjectId)
            productAwaitingUserReview.buildProduct(new Types.ObjectId(item.getProductId()))
            productAwaitingUserReview.buildStore(storeOrder.getStoreId())
            productAwaitingUserReview.buildStoreOrder(storeOrder.getId())
            productAwaitingUserReview.buildStatus(ProductsAwaitingUserReviewsStatusEnum.PENDING)
            console.log('here bfr await insert',productAwaitingUserReview);
            await Repository.ProductsAwaitingUserReviews().create(productAwaitingUserReview);  
          }          
        }
      }

      if (newStatus === OrderStatusEnum.READY_TO_DELIVER) { 
        await OrderOperationQueueService.getInstance().publishOrderReadyToPickupNotification(found.getId().toString());
        // await UpdateOrderController.sendTgNotification(found);
      }
      
      if (newStatus === OrderStatusEnum.CANCELLED) { 
        // const orderQueue = OrderQueueService.getInstance();
        // await orderQueue.publishCancelledOrderToQueue(found.getId().toString());   
        await UserCashbackLogModel.deleteOne({ order: found.getId() })
        const storeOrders = await Repository.StoreOrders().list({}, { orderId: found.getId() }, {} );
        for (let storeOrder of storeOrders) {
          if(storeOrder.getPayedFromCashback() > 0) {
            let userCashback = await Repository.UserCashback().getByUserAndStore(found.getUser() as Types.ObjectId, storeOrder.getStoreId())
            userCashback.buildCashbackAmount(userCashback.getCashbackAmount() + storeOrder.getPayedFromCashback())
            await Repository.UserCashback().update(userCashback)
          }
        }

        const user = await Repository.Users().getById(found.getUser() as Types.ObjectId);

        if (user) {
          const prevStats = user.getUserStats() ?? new UserStatsEntity()

            prevStats.buildCancelledOrdersCount((prevStats?.getCancelledOrdersCount() ?? 0) + 1)
            .buildCancelledOrdersSum((prevStats?.getCancelledOrdersSum() ?? 0) + (found.getTotalAmount() ?? 0))
            .buildLastOrderAt(new Date())
            .buildLastOrder(found.getId());

          user.buildUserStats(prevStats.convertToSchema());

          await Repository.Users().update(user);
        }
      }
      
      if (newStatus === OrderStatusEnum.RETURNED) {
        const items = found.getItems();

        const productIds = items.map((i) => new Types.ObjectId(i.getProductId()));
        const products = await Repository.Products().list({}, { _id: { $in: productIds } });

        const productMap = new Map(products.map((p) => [p.getId().toHexString(), p]));

        for (const item of items) {
          const product = productMap.get(item.getProductId());
          if (!product) continue;

          if (!product.getIsPreOrder()) {
            product.buildCount(product.getCount() + item.getQuantity());

            if (product.getCount() > product.getMinimumCount()) {
              product.buildStatus(product.getCount() > 10 ? ProductStatusEnum.IN_STOCK : ProductStatusEnum.LOW_STOCK);
            } else {
              product.buildStatus(ProductStatusEnum.OUT_OF_STOCK);
            }
          }
        }

        await Promise.all(products.map((product) => Repository.Products().update(product)));

        const storeOrders = await Repository.StoreOrders().list({}, { orderId: found.getId() }, {});

        console.log(storeOrders)

        for (let storeOrder of storeOrders) {
          if (!storeOrder.getIsCashbackAdded()) continue;

          const cashbackAmount = storeOrder.getCashbackEarned();
          const userId = found.getUser() as Types.ObjectId;

          if (cashbackAmount > 0) {
            let userCashback = await Repository.UserCashback().getByUserAndStore(userId, storeOrder.getStoreId());
            
            if (userCashback) {
              userCashback.buildCashbackAmount(Math.max(userCashback.getCashbackAmount() - cashbackAmount, 0));
              await Repository.UserCashback().update(userCashback);
            }
          }

          storeOrder.buildIsCashbackAdded(false);
          await Repository.StoreOrders().update(storeOrder);
        }

        // const user = await Repository.Users().getById(found.getUser() as Types.ObjectId);

        // if (user) {
        //   const stats = user.getUserStats() ?? new UserStatsEntity();
        //   stats
        //     .buildCompletedOrdersCount(Math.max((stats.getCompletedOrdersCount() ?? 1) - 1, 0))
        //     .buildCompletedOrdersSum(Math.max((stats.getCompletedOrdersSum() ?? 0) - (found.getTotalAmount() ?? 0), 0));
        //   user.buildUserStats(stats.convertToSchema());
        //   await Repository.Users().update(user);
        // }
      }

      // Send notification to the user about the order status change
      try {
        if (previousStatus !== newStatus && found.getUser()) {
          const notificationService = new NotificationTemplateService();
          await notificationService.sendOrderUpdateNotification(
            found.getUser().toString(),
            found.getId().toString(),
            newStatus
          );
        }
      } catch (notificationError) {
        console.error('Failed to send order status notification:', notificationError);
        // Don't fail the main operation if notification fails
      }

      return context.send.data({ updated: true });
    } catch (error) {
       await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Order',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
      // return context.send.error(error?.response?.data?.error);
    }
  }
  // private static async sendTgNotification(order: OrderEntity) {
  //   const shippingAddress: any = order.getShippingAddress()
  //   let deliveryAddressType =''
  //   let formattedShippingAddress: { address: string, mapLink: string };
  //   switch (order.getDeliveryAddressType()) {
  //     case DeliveryAddressTypeEnum.DELIVERY_POINT:
  //       formattedShippingAddress = {
  //         address: `${shippingAddress?.name} - ${shippingAddress?.location?.address}`,
  //         mapLink: ``,
  //       };
  //       deliveryAddressType = 'UZPOST'
  //       break;
  //       case DeliveryAddressTypeEnum.UBAY_POINT:
  //       formattedShippingAddress = {
  //         address: `${shippingAddress?.name} - ${shippingAddress?.location?.name} - ${shippingAddress?.location?.phoneNumber}`,
  //         mapLink: ``,
  //       };
  //       deliveryAddressType = 'UBAY';
        
  //       break;
  //       case DeliveryAddressTypeEnum.LOCATION:
  //       formattedShippingAddress = {
  //         address: `${shippingAddress?.name}`,
  //         mapLink: `https://yandex.com/maps/?ll=${shippingAddress?.location?.longitude},${shippingAddress?.location?.latitude}&z=16&pt=${shippingAddress?.location?.longitude},${shippingAddress?.location?.latitude},pm2rdm`,
  //       };
  //       deliveryAddressType = 'ДОСТАВКА';
        
  //       break;
  //     default:
  //       formattedShippingAddress = {
  //         address: `${shippingAddress?.name}`,
  //         mapLink: ``,
  //       };
  //       break;
      
  //   }  

  //   const params: OrderDetailTGBotSenderParamsInterface = {
  //     createdAt: order.getCreatedAt(),
  //     isPreOrder:order.getIsPreOrder(),
  //     orderCode: order.getOrderCode().toString(),
  //     customerName: order.getUserData()?.getUsername(),
  //     manager: order.getManagerName(),
  //     clientPhoneNumber: order.getUserData()?.getPhoneNumber(),
  //     deliveryAddressType,
  //     shippingAddress: formattedShippingAddress,
  //     urgentDelivery:order.getUrgentDelivery(),
  //     paymentType: order.getPaymentType(),
  //     promoCodeData:order.getPromoCodeData()? {
  //     code: order.getPromoCodeData()?.getCode(),
  //     type: order.getPromoCodeData()?.getType(),
  //     value: order.getPromoCodeData()?.getValue(),
  //     discountAmount: order.getPromoCodeData()?.getDiscountAmount()
  //     }:null,
  //     totalSum: order.getTotalAmount(),
  //     products: order.getItems().map((item) => ({
  //       name: item.getProductName().getRu(),
  //       quantity: item.getQuantity(),
  //       barcode: item.getBarcode() ?? null,
  //       skuCode: item.getSkuCode() ?? null,
  //       itemCode: item.getItemCode() ?? null,
  //       isPreOrder: item.getIsPreOrder(),
  //       price: item.getPrice(),
  //       discountPercent: item.getDiscountPercent()??0,
  //       discountAmount:item.getDiscountAmount()??0,
  //       finalPrice:item.getFinalPrice(),
  //     })),
  //     paid:false
  //   };
  //   const tgMessageSender = new TelegramBotMessageSender();
  //   await tgMessageSender.sendOrderReportExcelDocument(params);
  // }
}
