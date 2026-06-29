import { OrderEntity, OrderModel, OrderSchema, OrderStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { DateFilterParams } from '../../infrastructure';
import { FilterQuery } from 'mongoose';

@prefix('/stats')
export default class GetManagersPerformanceController {
  @request('get', '/managers-performance')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @query((DateFilterParams as any).swaggerDocument)

  static async controller(context: Context): Promise<void> {
    let params: DateFilterParams;
    try {
      params = await new DateFilterParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: FilterQuery<OrderSchema> = { status: OrderStatusEnum.DELIVERED };
      if (params.startDate || params.endDate) {
        filter.deliveredAt={}
        if (params.startDate) filter.deliveredAt.$gte = params.startDate;
        if (params.endDate) filter.deliveredAt.$lte = params.endDate;
      }
      const result = await OrderModel.aggregate([
        {
          $match: filter
        },
        {
          $group: {
            _id: { $ifNull: ["$manager", "UNKNOWN"] }, // handle missing manager
            ordersCount: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" }
          }
        },
        {
          $lookup: {
            from: "managers",
            localField: "_id",
            foreignField: "_id",
            as: "manager"
          }
        },
        {
          $unwind: {
            path: "$manager",
            preserveNullAndEmptyArrays: true // keep "UNKNOWN" ones
          }
        },
        {
          $project: {
            _id: 0,
            managerId: {
              $cond: [{ $eq: ["$_id", "UNKNOWN"] }, null, "$_id"]
            },
            managerName: {
              $cond: [
                { $eq: ["$_id", "UNKNOWN"] },
                "Unknown",
                "$manager.name"
              ]
            },
            ordersCount: 1,
            totalAmount: 1
          }
        },
        {
          $sort: { ordersCount: -1 }
        }
      ]);
      return context.send.data({result});
    } catch (error) {
      return context.send.error(error);
    }
  }
}
