import { Context } from 'koa';
import { ListParams, OrderListParams } from '../../infrastructure';
import { body, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { DeliveryAddressTypeEnum, OrderEntity, OrderStatusEnum, PaymentTypeEnum, PromoCodeTypeEnum, Repository } from '@ubaytools/core';

export class OrderListItemResponse {
  id: string;
  orderCode: string;
  userData: {
    userId: string;
    username: string;
    phoneNumber: string;
    needToCall: boolean;
  };
  quantity: number;
  totalAmount: number;
  subTotal: number;
  discountAmount: number;
  deliveryPrice: number;
  status: OrderStatusEnum;
  shippingAddress: object;
  createdAt: Date;
  deliveredAt: Date;
  deliveryAddressType: DeliveryAddressTypeEnum;
  promoCodeData: {
    code: string;
    type: PromoCodeTypeEnum;
    value: number;
    discountAmount: number;
  };
  urgentDelivery: boolean;
  isPreOrder: boolean;
  paymentType: PaymentTypeEnum;
  managerName: string;
  paymentConfirmed: boolean;

  constructor(order: OrderEntity, quantity: number) {
    this.id = order.getId().toString();
    this.orderCode = order.getOrderCode();
    this.userData = {
      userId: order.getUser().toString(),
      username: order.getUserData()?.getUsername(),
      phoneNumber: order.getUserData()?.getPhoneNumber(),
      needToCall: order.getUserData()?.getNeedToCall(),
    };
    this.quantity = quantity;
    this.totalAmount = order.getTotalAmount();
    this.subTotal = order.getSubTotal();
    this.discountAmount = order.getDiscountAmount();
    this.deliveryPrice = order.getDeliveryPrice() ?? 0;

    this.status = order.getStatus();
    this.shippingAddress = order.getShippingAddress();
    this.createdAt = order.getCreatedAt();
    this.deliveredAt = order.getDeliveredAt() ?? null;
    this.deliveryAddressType = order.getDeliveryAddressType() ?? null;
    this.promoCodeData = order.getPromoCodeData()
      ? {
          code: order.getPromoCodeData()?.getCode(),
          type: order.getPromoCodeData()?.getType(),
          value: order.getPromoCodeData()?.getValue(),
          discountAmount: order.getPromoCodeData()?.getDiscountAmount(),
        }
      : null;
    this.urgentDelivery = order.getUrgentDelivery() ?? null;
    this.isPreOrder = order.getIsPreOrder() ?? null;
    this.paymentType = order.getPaymentType() ?? null;
    this.managerName = order.getManagerName() ?? null;
    this.paymentConfirmed = order.getPaymentConfirmed() ?? null;
  }
}

export class StoreOrderListItemResponse {
  id: string;
  orderCode: string;
  userData: {
    username: string;
    phoneNumber: string;
    needToCall: boolean;
  };
  totalAmount: number;
  subTotal: number;
  discountAmount: number;
  deliveryPrice: number;
  isPreOrder: boolean;

  constructor(order: any) {
    this.id = order.getId().toString();
    this.orderCode = order.getOrderCode();

    this.userData = {
      username: order.getUserData()?.getUsername(),
      phoneNumber: order.getUserData()?.getPhoneNumber(),
      needToCall: order.getUserData()?.getNeedToCall(),
    };
    this.totalAmount = order.getTotalAmount();
    this.subTotal = order.getSubTotal();
    this.discountAmount = order.getDiscountAmount();
    this.deliveryPrice = order.getDeliveryPrice() ?? 0;
    this.isPreOrder = order.getIsPreOrder?.() ?? null;
  }
}

@prefix('/orders')
export default class OrderListController {
  @request('post', '/list')
  @summary('Order list')
  @security([])
  @tags(['Orders'])
  @query((ListParams as any).swaggerDocument)
  @body((OrderListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    let params: OrderListParams;
    try {
      listParams = await new ListParams(context.request.query).validate();
      params = await new OrderListParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter = {};
      if (params.filter) {
        if (params.filter.customer) filter['user'] = params.filter.customer;
        if (params.filter.status) filter['status'] = params.filter.status as OrderStatusEnum;
        if (params.filter.paymentType) filter['paymentType'] = params.filter.paymentType as PaymentTypeEnum;
        if (params.filter.paymentConfirmed !== undefined) filter['paymentConfirmed'] = params.filter.paymentConfirmed;
        if (params.filter.minPrice !== undefined || params.filter.maxPrice !== undefined) {
          filter['totalAmount'] = {};
          if (params.filter.minPrice !== undefined) filter['totalAmount'].$gte = params.filter.minPrice;
          if (params.filter.maxPrice !== undefined) filter['totalAmount'].$lte = params.filter.maxPrice;
        }

        if (params.filter.startDate || params.filter.endDate) {
          filter['createdAt'] = {};
          if (params.filter.startDate) filter['createdAt'].$gte = params.filter.startDate;
          if (params.filter.endDate) filter['createdAt'].$lte = params.filter.endDate;
        }
      }
      if (params.search) {
        filter['$or'] = [
          { orderCode: { $regex: params.search, $options: 'i' } },
          { 'userData.username': { $regex: params.search, $options: 'i' } },
          { 'userData.phoneNumber': { $regex: params.search, $options: 'i' } },
        ];
      }

      let orders: any;
      let count: any;
      if (context.auth?.seller && params.store) {
        filter['sellerId'] = context.auth.seller;
        filter['storeId'] = params.store;
        count = await Repository.StoreOrders().countDocumentsByFilter(filter);
        orders = await Repository.StoreOrders().list({ page: listParams.page, size: listParams.size }, filter, { createdAt: -1 });
      } else {
        count = await Repository.Orders().countDocumentsByFilter(filter);
        orders = await Repository.Orders().list({ page: listParams.page, size: listParams.size }, filter, { createdAt: -1 });
      }

      const response = await Promise.all(
        orders.map(async (order) => {
          if (context.auth?.seller) {
            return new StoreOrderListItemResponse(order);
          }
          const quantity = order.getItems().length;
          return new OrderListItemResponse(order, quantity);
        }),
      );
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
