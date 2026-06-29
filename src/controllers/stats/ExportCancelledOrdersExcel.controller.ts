import { OrderModel, OrderStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { header, prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { buildExcelBuffer } from '../../utils/excel';

@prefix('/stats')
export default class ExportCancelledOrdersExcelController {
  @request('post', '/cancelled-orders/download-excel')
  @summary('Download Cancelled Orders Excel')
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
      const orders = await OrderModel.aggregate([
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
            _id: 0,
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

      const excelData = orders.map((order, index) => ({
        No: index + 1,
        OrderCode: order.orderCode,
        TotalAmount: order.totalAmount,
        SubTotal: order.subTotal,
        Discount: order.discountAmount,
        DeliveryPrice: order.deliveryPrice,
        Manager: order.managerName,
        Comment: order.comment,
        PaymentType: order.paymentType,
        DeliveryType: order.deliveryAddressType,
      }));

      const buffer = buildExcelBuffer(excelData, 'Cancelled Orders');

      context.set('Content-Disposition', 'attachment; filename="cancelled-orders.xlsx"');
      context.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.body = buffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
