import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';
import { GetCashbackStatsParams, RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';
import { OrderStatusEnum, Redis, UserCashbackLogModel, UserCashbackLogType } from '@ubaytools/core';
import { Types } from 'mongoose';

@prefix('/stats')
export default class GetCashbackStatsController {
  @request('get', '/cashback')
  @summary('Cashback statistics')
  @security([])
  @tags(['Statistics'])
  @query({
    ...(RequiredDateFilterParams as any).swaggerDocument,
    ...(GetCashbackStatsParams as any).swaggerDocument,
  })
  static async controller(context: Context): Promise<void> {
    let params: RequiredDateFilterParams;
    let cashbackParams: GetCashbackStatsParams;

    try {
      params = await new RequiredDateFilterParams(context.request.query).validate();
      cashbackParams = await new GetCashbackStatsParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const clientRedis = await Redis.getInstance();
      let cacheKey =
        `${process.env.NODE_ENV}:stats:cashback:` +
        `${params.startDate.toISOString().split('T')[0]}:` +
        `${params.endDate.toISOString().split('T')[0]}:`;

      const cacheData: any = await clientRedis.get(cacheKey);
      let response: any;
      const diffInDays = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24);

      let dateFormat = '%Y-%m';
      if (diffInDays <= 30) dateFormat = '%Y-%m-%d';

      const baseMatch: any = {};
      if (cashbackParams.store) {
        cacheKey += `store:${cashbackParams.store}:`;
        baseMatch.store = new Types.ObjectId(cashbackParams.store);
      }

      if (cacheData) {
        response = JSON.parse(cacheData);
      } else {
        const result = await UserCashbackLogModel.aggregate([
          { $match: baseMatch },
          {
            $facet: {
              earned: [
                {
                  $match: {
                    type: UserCashbackLogType.EARNED,
                    createdAt: { $gte: params.startDate, $lte: params.endDate },
                  },
                },
                {
                  $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    amount: { $sum: '$amount' },
                  },
                },
              ],
              used: [
                { $match: { type: UserCashbackLogType.USED, order: { $ne: null } } },

                {
                  $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: 'orderDoc',
                  },
                },
                { $unwind: '$orderDoc' },
                {
                  $match: {
                    'orderDoc.status': OrderStatusEnum.DELIVERED,
                    'orderDoc.deliveredAt': { $gte: params.startDate, $lte: params.endDate },
                  },
                },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: dateFormat,
                        date: '$orderDoc.deliveredAt',
                      },
                    },
                    amount: { $sum: '$amount' },
                  },
                },
              ],
            },
          },
          {
            $project: {
              merged: {
                $concatArrays: [
                  {
                    $map: {
                      input: '$earned',
                      as: 'e',
                      in: { period: '$$e._id', earned: '$$e.amount', used: 0 },
                    },
                  },
                  {
                    $map: {
                      input: '$used',
                      as: 'u',
                      in: { period: '$$u._id', earned: 0, used: '$$u.amount' },
                    },
                  },
                ],
              },
            },
          },
          { $unwind: '$merged' },
          {
            $group: {
              _id: '$merged.period',
              earned: { $sum: '$merged.earned' },
              used: { $sum: '$merged.used' },
            },
          },

          { $sort: { _id: 1 } },
        ]);

        const allPeriods = GeneratePeriods.execute(params.startDate, params.endDate, diffInDays);

        const statsMap = result.reduce((acc, item) => {
          acc[item._id] = {
            earned: item.earned ?? 0,
            used: item.used ?? 0,
          };
          return acc;
        }, {} as Record<string, { earned: number; used: number }>);

        response = allPeriods.map((period) => ({
          period,
          earned: statsMap[period]?.earned ?? 0,
          used: statsMap[period]?.used ?? 0,
        }));
        await clientRedis.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
      }
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
