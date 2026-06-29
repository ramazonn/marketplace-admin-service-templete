import {  OrderModel, OrderStatusEnum, ProductsModel, ProductStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query, } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { totalmem } from 'os';

@prefix('/stats')
export default class GetOrdersCountByStatusController {
  @request('get', '/orders-by-status')
  @summary('Statistics')
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
      
      let result = await OrderModel.aggregate([
        {
          $facet: {
            PENDING: [
              { $match: { status: 'PENDING',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],            
            PROCESSING: [
              { $match: { status: 'PROCESSING',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],
            CONFIRMED: [
              { $match: { status: 'CONFIRMED',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],
            PREPARING: [
              { $match: { status: 'PREPARING',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],
            READY_TO_DELIVER: [
              { $match: { status: 'READY_TO_DELIVER',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ], 
            SHIPPED: [
              { $match: { status: 'SHIPPED',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],
            READY_TO_PICKUP: [
              { $match: { status: 'READY_TO_PICKUP',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],         
            DELIVERED: [
              { $match: { status: 'DELIVERED', deliveredAt: { $gte: params.startDate, $lte: params.endDate } } },
              { $count: "count" }
            ],
            CANCELLED: [
              { $match: { status: 'CANCELLED',updatedAt: { $gte: params.startDate, $lte: params.endDate }} },
              { $count: "count" }
            ],
          }
        },
        {
          $project: {
            PENDING: { $ifNull: [{ $arrayElemAt: ["$PENDING.count", 0] }, 0] },
            PROCESSING: { $ifNull: [{ $arrayElemAt: ["$PROCESSING.count", 0] }, 0] },
            CONFIRMED: { $ifNull: [{ $arrayElemAt: ["$CONFIRMED.count", 0] }, 0] },
            PREPARING: { $ifNull: [{ $arrayElemAt: ["$PREPARING.count", 0] }, 0] },
            READY_TO_DELIVER: { $ifNull: [{ $arrayElemAt: ["$READY_TO_DELIVER.count", 0] }, 0] },
            SHIPPED: { $ifNull: [{ $arrayElemAt: ["$SHIPPED.count", 0] }, 0] },
            READY_TO_PICKUP: { $ifNull: [{ $arrayElemAt: ["$READY_TO_PICKUP.count", 0] }, 0] },
            DELIVERED: { $ifNull: [{ $arrayElemAt: ["$DELIVERED.count", 0] }, 0] },
            CANCELLED: { $ifNull: [{ $arrayElemAt: ["$CANCELLED.count", 0] }, 0] },
          }
        },
        {
          $project: {
            data: { $objectToArray: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: 0,
            data: {
              $map: {
                input: "$data",
                as: "item",
                in: {
                  status: "$$item.k",
                  count: "$$item.v"
                }
              }
            }
          }
        },
        { $unwind: "$data" },
        { $replaceRoot: { newRoot: "$data" } }
      ]);
      let totalCount=0
      result.map(e => {
        totalCount+=e.count
      })

      return context.send.data({statusses:result,totalCount});
    } catch (error) {
      return context.send.error(error);
    }
  }
}
