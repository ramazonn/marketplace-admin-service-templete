import { OrderModel, OrderStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';

export class CancelledOrderResponse {
  id?: string;
  orderCode?: string;
  totalAmount?: number;
  subTotal?: number;
  discountAmount?: number;
  deliveryPrice?: number;
  managerName?: string;
  comment?: string;
  paymentType?: string;
  deliveryAddressType?: string;

  constructor(order: any) {
    this.id = order._id ? order._id.toString() : order.id;

    this.orderCode = order.orderCode ?? null;
    this.totalAmount = order.totalAmount ?? 0;
    this.subTotal = order.subTotal ?? 0;
    this.discountAmount = order.discountAmount ?? 0;
    this.deliveryPrice = order.deliveryPrice ?? 0;

    this.managerName = order.managerName ?? null;
    this.comment = order.comment ?? null;

    this.paymentType = order.paymentType ?? null;
    this.deliveryAddressType = order.deliveryAddressType ?? null;
  }
}

@prefix('/stats')
export default class GetCancelledOrdersController {
  @request('get', '/cancelled-orders')
  @summary('Cancelled Orders List')
  @security([])
  @tags(['Statistics'])
  @query((RequiredDateFilterParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: RequiredDateFilterParams;

    try {
      params = await new RequiredDateFilterParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const result = await OrderModel.aggregate([
        {
          $match: {
            status: OrderStatusEnum.CANCELLED,
            updatedAt: {
              $gte: params.startDate,
              $lte: params.endDate,
            },
          },
        },
        {
          $project: {
            _id: 1,
            orderCode: 1,
            totalAmount: 1,
            subTotal: 1,
            discountAmount: 1,
            deliveryPrice: 1,
            managerName: 1,
            comment: 1,
            paymentType: 1,
            deliveryAddressType: 1,
          },
        },
      ]);
      const response = result.map(order => new CancelledOrderResponse(order));

      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
