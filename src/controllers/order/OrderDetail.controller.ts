import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import {
  CloudFlareService,
  DeliveryAddressTypeEnum,
  LanguageEnum,
  NotFoundError,
  OrderEntity,
  OrderItemEntity,
  OrderStatusEnum,
  PaymentTypeEnum,
  PromoCodeTypeEnum,
  Repository,
  StoreOrderEntity,
} from '@ubaytools/core';
import { Types } from 'mongoose';

export class StoreOrderItemResponse {
  productId: string;
  storeId: string;
  productName: string;
  images: Array<string>;
  brand: string;
  barcode: string;
  skuCode: string;
  quantity: number;
  currentPrice: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  cashbackEarned: number;
  appliedPromoCodeAmount: number;
  hasDiscount: boolean;
  hasPromoCode: boolean;
  isPreOrder: boolean;

  constructor(order: OrderItemEntity, lang: LanguageEnum) {
    this.productId = order.getProductId()?.toString() ?? null;
    this.storeId = order.getStoreId()?.toString() ?? null;
    this.productName = order.getProductName()?.getByLang(lang) ?? null;
    this.images = order.getAttachments()?.map((item) => CloudFlareService.getImageUrlByFileID(item)) ?? [];
    this.brand = order.getBrand() ?? null;
    this.barcode = order.getBarcode() ?? null;
    this.skuCode = order.getSkuCode() ?? null;
    this.quantity = order.getQuantity() ?? null;
    this.currentPrice = order.getPrice() ?? null;
    this.discountAmount = order.getDiscountAmount() ?? null;
    this.discountPercent = order.getDiscountPercent() ?? null;
    this.finalPrice = order.getFinalPrice() ?? null;
    this.cashbackEarned = order.getCashbackEarned() ?? null;
    this.appliedPromoCodeAmount = order.getAppliedPromoCodeAmount() ?? null;
    this.hasDiscount = order.getHasDiscount() ?? null;
    this.hasPromoCode = order.getHasPromoCode() ?? null;
    this.isPreOrder = order.getIsPreOrder() ?? null;
  }
}

export class StoreOrderResponse {
  id: string;
  storeId: string;
  orderId: string;
  sellerId: string;
  storeName: string;
  storeAvatar: string;
  totalAmount: number;
  discountAmount: number;
  deliveryPrice: number;
  subTotal: number;
  cashbackEarned: number;
  payedFromCashback: number;
  userData: any;
  items: Array<StoreOrderItemResponse>;
  promoCodeData: any;
  isPreOrder: boolean;

  constructor(order: StoreOrderEntity, items: StoreOrderItemResponse[]) {
    this.id = order.getId()?.toString() ?? null;
    this.storeId = order.getStoreId()?.toString() ?? null;
    this.storeName = order.getStoreName() ?? null;
    this.storeAvatar = order.getStoreAvatar() ? CloudFlareService.getImageUrlByFileID(order.getStoreAvatar()) : null;
    this.totalAmount = order.getTotalAmount() ?? null;
    this.discountAmount = order.getDiscountAmount() ?? null;
    this.deliveryPrice = order.getDeliveryPrice() ?? null;
    this.subTotal = order.getSubTotal() ?? null;
    this.cashbackEarned = order.getCashbackEarned() ?? null;
    this.payedFromCashback = order.getPayedFromCashback() ?? null;
    this.userData = order.getUserData()?.convertToSchema() ?? null;
    this.items = items ?? null;
    this.promoCodeData = order.getPromoCodeData() ?? null;
    this.isPreOrder = order.getIsPreOrder() ?? null;
  }
}

export class OrderDetailResponse {
  id: string;
  orderCode: string;
  userData: {
    userId: string;
    username: string;
    phoneNumber: string;
    needToCall: boolean;
    lastOrderAt?: Date;
    completedOrdersCount?: number;
    cancelledOrdersCount?: number;
    lastOrderId?: string;
  };
  totalAmount: number;
  subTotal: number;
  discountAmount: number;
  deliveryPrice: number;
  status: OrderStatusEnum;
  shippingAddress: object;
  deliveryAddressType: DeliveryAddressTypeEnum;
  createdAt: Date;
  deliveredAt: Date;
  paymentType: PaymentTypeEnum;
  managerName: string;
  manager: string;
  comment: string;
  promoCodeData: {
    code: string;
    type: PromoCodeTypeEnum;
    value: number;
    discountAmount: number;
  };
  orderChangeLogs: any[];
  urgentDelivery: boolean;
  storeOrders: any[];
  isPreOrder: boolean;

  constructor(order: OrderEntity, storeOrders: StoreOrderResponse[], orderChangeLogs: any[], userStatsData: any) {
    this.id = order.getId().toString();
    this.orderCode = order.getOrderCode();
    this.userData = {
      userId: order.getUser().toString(),
      username: order.getUserData()?.getUsername(),
      phoneNumber: order.getUserData()?.getPhoneNumber(),
      needToCall: order.getUserData()?.getNeedToCall(),

      lastOrderAt: userStatsData?.lastOrderAt ?? null,
      completedOrdersCount: userStatsData?.completedOrdersCount ?? 0,
      cancelledOrdersCount: userStatsData?.cancelledOrdersCount ?? 0,
      lastOrderId: userStatsData?.lastOrderId ?? null,
    };
    this.totalAmount = order.getTotalAmount() ?? 0;
    this.subTotal = order.getSubTotal() ?? 0;
    this.discountAmount = order.getDiscountAmount() ?? 0;
    this.deliveryPrice = order.getDeliveryPrice();
    this.status = order.getStatus();
    this.shippingAddress = order.getShippingAddress();
    this.createdAt = order.getCreatedAt();
    this.deliveredAt = order.getDeliveredAt();
    this.deliveryAddressType = order.getDeliveryAddressType();
    this.paymentType = order.getPaymentType();
    this.manager = order.getManager()?.toString() ?? null;
    this.managerName = order.getManagerName() ?? null;
    this.comment = order.getComment() ?? null;
    this.promoCodeData = order.getPromoCodeData()
      ? {
        code: order.getPromoCodeData()?.getCode(),
        type: order.getPromoCodeData()?.getType(),
        value: order.getPromoCodeData()?.getValue(),
        discountAmount: order.getPromoCodeData()?.getDiscountAmount(),
      }
      : null;
    this.orderChangeLogs = orderChangeLogs;
    this.urgentDelivery = order.getUrgentDelivery() ?? null;
    this.storeOrders = storeOrders ?? [];
    this.isPreOrder = order.getIsPreOrder() ?? null;
  }
}

export class SellerOrderDetailResponse {
  id: string;
  orderCode: string;
  storeId: string;
  storeName: string;
  storeAvatar: string;
  userData: any;
  totalAmount: number;
  subTotal: number;
  discountAmount: number;
  deliveryPrice: number;
  cashbackEarned: number;
  payedFromCashback: number;
  items: StoreOrderItemResponse[];
  promoCodeData: any;
  isPreOrder: boolean;

  constructor(order: StoreOrderEntity, items: StoreOrderItemResponse[]) {
    this.id = order.getId().toString();
    this.orderCode = order.getOrderCode();
    this.storeId = order.getStoreId()?.toString();
    this.storeName = order.getStoreName();
    this.storeAvatar = order.getStoreAvatar() ? CloudFlareService.getImageUrlByFileID(order.getStoreAvatar()) : null;
    this.userData = order.getUserData()?.convertToSchema() ?? null;
    this.totalAmount = order.getTotalAmount();
    this.subTotal = order.getSubTotal();
    this.discountAmount = order.getDiscountAmount();
    this.deliveryPrice = order.getDeliveryPrice();
    this.cashbackEarned = order.getCashbackEarned();
    this.payedFromCashback = order.getPayedFromCashback();
    this.items = items;
    this.promoCodeData = order.getPromoCodeData() ?? null;
    this.isPreOrder = order.getIsPreOrder() ?? null;
  }
}
@prefix('/orders')
export default class OrderDetailController {
  @request('get', '/detail/{orderId}')
  @summary('Order detail')
  @security([])
  @tags(['Orders'])
  @path({ orderId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.orderId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const seller = context.auth?.seller;

      if (seller) {
        const storeOrderId = new Types.ObjectId(params.id);

        const storeOrder = await Repository.StoreOrders().getById(storeOrderId);

        if (!storeOrder) {
          throw new NotFoundError('StoreOrder by id');
        }
        const items = storeOrder.getItems().map((item) => new StoreOrderItemResponse(item, context.lang));

        const response = new SellerOrderDetailResponse(storeOrder, items);

        return context.send.data(response);
      }

      const found = await Repository.Orders().getById(new Types.ObjectId(params.id));
      console.log(found.getUser());
      if (!found) {
        throw new NotFoundError('Order by id');
      }

      const user = await Repository.Users().getById(found.getUser() as Types.ObjectId);
      console.log(user);

      let userStats = user?.getUserStats();

      const userStatsData = userStats
        ? {
          lastOrderAt: userStats.getLastOrderAt(),
          completedOrdersCount: userStats.getCompletedOrdersCount(),
          cancelledOrdersCount: userStats.getCancelledOrdersCount(),
          lastOrderId: userStats.getLastOrder()?.toString() ?? null,
        }
        : null;

      const storeOrders = await Repository.StoreOrders().list({}, { orderId: new Types.ObjectId(params.id) }, {});
      const storeOrdersResponse = storeOrders.map((order) => {
        const items = order.getItems().map((item) => new StoreOrderItemResponse(item, context.lang));
        return new StoreOrderResponse(order, items);
      });
      const orderChangeLogs = await Repository.OrderChangeLogs().findByOrder(new Types.ObjectId(params.id));
      const formattedOrderChangeLogs = orderChangeLogs.map((change) => {
        return {
          date: change.getCreatedAt(),
          updatedBy: change.getAdminData(),
          changes: change.getChanges(),
        };
      });

      const response = new OrderDetailResponse(found, storeOrdersResponse, formattedOrderChangeLogs, userStatsData);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
