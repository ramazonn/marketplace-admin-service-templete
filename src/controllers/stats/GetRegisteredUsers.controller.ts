import { OrderModel, OrderStatusEnum, ProductsModel, ProductStatusEnum, Redis, UserModel, UserStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetRegisteredUsersController {
  @request('get', '/registered-users')
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

      const cacheKey = `${process.env.NODE_ENV}:stats:registered-users:` + `${params.startDate.toISOString().split('T')[0]}:` + `${params.endDate.toISOString().split('T')[0]}`;

      let casheData: any = await redisClient.get(cacheKey);

      let response: any;

      
        const diffInDays = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24);

        let dateFormat = '%Y-%m'; // monthly
        if (diffInDays <= 30) {
          dateFormat = '%Y-%m-%d'; // daily
        }
        if (casheData) {
        response = JSON.parse(casheData);
      } else {
        // Aggregate active users by period
        let result = await UserModel.aggregate([
          {
            $match: {
              createdAt: { $gte: params.startDate, $lte: params.endDate },
              status: UserStatusEnum.ACTIVE,
            },
          },
          {
            $group: {
              _id: { period: { $dateToString: { format: dateFormat, date: '$createdAt' } } },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.period': 1 } },
        ]);

        // Fill missing periods
        const allPeriods = GeneratePeriods.execute(params.startDate, params.endDate, diffInDays);
        const statsMap = result.reduce((acc, item) => {
          acc[item._id.period] = { count: item.count };
          return acc;
        }, {} as Record<string, { count: number }>);

        response = allPeriods.map((period) => ({
          period,
          count: statsMap[period]?.count ?? 0,
        }));
        await redisClient.set(cacheKey, JSON.stringify(response), 60 * 60);
      }

      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
