import { OrderModel, OrderStatusEnum, ProductsModel, ProductStatusEnum, Redis } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetDeliveredOrdersController {
  @request('get', '/delivered-orders')
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

      const cacheKey = `${process.env.NODE_ENV}:stats:delivered-orders:` + `${params.startDate.toISOString().split('T')[0]}:` + `${params.endDate.toISOString().split('T')[0]}`;

      let response: any = await redisClient.get(cacheKey);

      if (response) {
        response = JSON.parse(response);
      } else {
        const diffInDays = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24);

        let dateFormat = '%Y-%m';

        if (diffInDays <= 30) {
          dateFormat = '%Y-%m-%d';
        }

        const result = await OrderModel.aggregate([
          {
            $match: {
              deliveredAt: {
                $gte: params.startDate,
                $lte: params.endDate,
              },
              status: OrderStatusEnum.DELIVERED,
            },
          },
          {
            $group: {
              _id: {
                period: {
                  $dateToString: {
                    format: dateFormat,
                    date: '$deliveredAt',
                  },
                },
              },
              count: {
                $sum: 1,
              },
              totalAmount: {
                $sum: '$totalAmount',
              },
            },
          },
          {
            $sort: {
              '_id.period': 1,
            },
          },
        ]);

        const allPeriods = GeneratePeriods.execute(params.startDate, params.endDate, diffInDays);

        const statsMap = result.reduce((acc, item) => {
          acc[item._id.period] = {
            count: item.count,
            totalAmount: item.totalAmount,
          };

          return acc;
        }, {} as Record<string, { count: number; totalAmount: number }>);

        response = allPeriods.map((period) => ({
          period,
          count: statsMap[period]?.count ?? 0,
          totalAmount: statsMap[period]?.totalAmount ?? 0,
          avgOrderPrice: statsMap[period]?.count > 0 ? Math.round(statsMap[period].totalAmount / statsMap[period].count) : 0,
        }));

        await redisClient.set(cacheKey, JSON.stringify(response), 60 * 60);
      }

      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
