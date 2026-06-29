import { Context } from 'koa';
import { CancelOrdersParams } from '../../infrastructure';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import {
  ActionLogFailureReasonEnum,
  ActionTypeEnum,
  AdminsEntity,
  BaseError,
  OrderStatusEnum,
  ProductStatusEnum,
  Repository,
  RolesEnum,
  UserCashbackLogModel,
  UserStatsEntity,
} from '@ubaytools/core';
import { Types } from 'mongoose';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/orders')
export default class CancelOrderController {
  @request('put', '/cancel')
  @summary('Order cancel')
  @security([])
  @tags(['Orders'])
  @body((CancelOrdersParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: CancelOrdersParams;

    try {
      params = await new CancelOrdersParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const admin: AdminsEntity = context.admin;

      const ObjectOrderIds = params.orderIds.map((id) => new Types.ObjectId(id));
      const ordersToCancel = await Repository.Orders().list({ page: 1, size: ObjectOrderIds.length }, { _id: { $in: ObjectOrderIds } });
      if (!ordersToCancel.length) {
        throw new Error('Orders not found');
      }
      let hasOrdersBeingProcessed = false;
      for (let order of ordersToCancel) {
        const orderStatus = order.getStatus();
        if (![OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING].includes(orderStatus)) {
          hasOrdersBeingProcessed = true;
        }
      }
      console.log('has order being processed:', hasOrdersBeingProcessed, admin.getRole());

      const role = admin.getRole();

      if (!(role instanceof Types.ObjectId) && role?.getCode() !== RolesEnum.SUPER_ADMIN && hasOrdersBeingProcessed) {
        throw new BaseError('You cannot cancel order');
      }
      // if (admin.getRole()!==RolesEnum.SUPER_ADMIN && hasOrdersBeingProcessed) {
      //   throw new BaseError('You cannot cancel order')
      // }
      let before = {};

      for (let order of ordersToCancel) {
        before = await Repository.Orders().findOneRaw(order.getId());
        order.buildStatus(OrderStatusEnum.CANCELLED);
        order.buildCancelledAt(new Date());
        // TODO: Add cancellation logic here {payment cancellation}
        await Promise.all(
          order.getItems().map(async (item) => {
            const productId = new Types.ObjectId(item.getProductId());
            const product = await Repository.Products().getById(productId);
            if (product) {
              const orderQuantity = item.getQuantity();
              const productMinimumCount = product.getMinimumCount();
              let productCount = product.getCount();
              productCount = productCount + orderQuantity;
              if (productCount > productMinimumCount) {
                product.buildStatus(ProductStatusEnum.IN_STOCK);
              }

              // ToDo: it works only 1 special-event(friday) if special-event count increase this logic may fail
              const specialEventProducts = await Repository.SpecialEventProducts().findByProductId(productId);
              const specialEventProduct = specialEventProducts[0];

              const limitForSale = specialEventProduct?.getLimitForSale();
              let soldCount = specialEventProduct?.getSoldCount();
              if (specialEventProduct) {
                soldCount = soldCount - item.getQuantity();
                soldCount = soldCount > 0 ? soldCount : 0;
                specialEventProduct.buildSoldCount(soldCount);
                specialEventProduct.buildIsActive(limitForSale > soldCount);
                console.log(specialEventProduct, soldCount);
                await Repository.SpecialEventProducts().update(specialEventProduct);
              }

              product.buildCount(productCount);
              await Repository.Products().update(product);
            }
          }),
        );
        const storeOrders = await Repository.StoreOrders().list({}, { orderId: order.getId() }, {});
        for (let storeOrder of storeOrders) {
          if (storeOrder.getPayedFromCashback() > 0) {
            let userCashback = await Repository.UserCashback().getByUserAndStore(order.getUser() as Types.ObjectId, storeOrder.getStoreId());
            userCashback.buildCashbackAmount(userCashback.getCashbackAmount() + storeOrder.getPayedFromCashback());
            await Repository.UserCashback().update(userCashback);
          }
        }

        const user = await Repository.Users().getById(order.getUser() as Types.ObjectId);

        if (user) {
          let stats = user.getUserStats() ?? new UserStatsEntity();
          stats.buildCancelledOrdersCount((stats.getCancelledOrdersCount() ?? 0) + 1)
            .buildCancelledOrdersSum((stats.getCancelledOrdersSum() ?? 0) + (order.getTotalAmount() ?? 0))
            .buildLastOrderAt(new Date())
            .buildLastOrder(order.getId());

          user.buildUserStats(stats.convertToSchema());
          await Repository.Users().update(user);
        }

        await UserCashbackLogModel.deleteOne({ order: order.getId() });
        const updatedOrder = await Repository.Orders().update(order);

        await ActionLogService.logSuccess({
          context,
          action: ActionTypeEnum.UPDATE,
          resource: 'Order',
          resourceId: order.getId(),
          before,
          after: updatedOrder.convertToSchema() as unknown as Record<string, unknown>,
        });
        // const orderQueue = OrderQueueService.getInstance();
        // await orderQueue.publishCancelledOrderToQueue(order.getId().toString());
      }

      await InvalidateRedisCache.execute('carousel:list:');
      await InvalidateRedisCache.execute('carousel:count');
      await InvalidateRedisCache.execute('special-event:list:');
      await InvalidateRedisCache.execute('special-event:count');

      return context.send.data({ canceled: true });
    } catch (error) {
      for (const orderId of params.orderIds) {
        await ActionLogService.logFailure({
          context,
          action: ActionTypeEnum.UPDATE,
          resource: 'Order',
          resourceId: new Types.ObjectId(orderId),
          failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return context.send.error(error);
    }
  }
}
