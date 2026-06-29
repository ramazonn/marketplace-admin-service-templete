import {  OrderModel, OrderStatusEnum, Redis} from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query, } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetActiveUsersController {
  @request('get', '/active-users')
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

      const redisClient = await Redis.getInstance();

      const cacheKey =`${process.env.NODE_ENV}:stats:active-users:`+`${params.startDate.toISOString().split('T')[0]}:`+`${params.endDate.toISOString().split('T')[0]}`;

      let response: any;

      const cacheData = await redisClient.get(cacheKey)
      if(cacheData) {
        response = JSON.parse(cacheData)
      } else {

      let result = await OrderModel.aggregate([
        {
          $match: {
            createdAt: {              
              $gte: params.startDate, // start date
              $lte: params.endDate  // end date
            }
          }
        },
        {
          $group: {
            _id: {
              user: "$user",
              month: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" }
              }
            }
          }
        },
        {
          $group: {
            _id: "$_id.month",
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            month: "$_id",
            count: 1
          }
        }
      ]);
      const allMonth = GeneratePeriods.month(params.startDate, params.endDate);

      const statsMap = result.reduce((acc, item) => {
        acc[item.month] = {
          count: item.count
        };
        return acc;
      }, {} as Record<string, { count: number}>);

      response = allMonth.map(month => ({
        month,
        count: statsMap[month]?.count ?? 0,
      }));
      await redisClient.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
    }
      
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
  
}


