import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { Context } from 'koa';
import { OrderModel, Redis } from '@ubaytools/core';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetOrderStatusAverageDurationsController {
  @request('get', '/order-status-average-durations')
  @summary('Average order status time by day or month')
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
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      const clientRedis = await Redis.getInstance();

      const cacheKey =`${process.env.NODE_ENV}:stats:order-status-average-durations:` + `${startDate.toISOString().split('T')[0]}:` + `${endDate.toISOString().split('T')[0]}`;

      const cacheData: any = await clientRedis.get(cacheKey);

      let items: any;
      const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      let dateFormat = '%Y-%m';
      if (diffInDays <= 30) {
        dateFormat = '%Y-%m-%d';
      }

      if(cacheData) {
        items = JSON.parse(cacheData);
      } else {
      const result = await OrderModel.aggregate([
        {
          $match: {
            confirmedAt: { $ne: null, $gte: startDate, $lte: endDate },
            createdAt: { $ne: null },
            $expr: {
              $gte: ['$confirmedAt', '$createdAt'],
            },
          },
        },
        {
          $project: {
            period: {
              $dateToString: {
                format: dateFormat,
                date: '$confirmedAt',
              },
            },
            createdToConfirmedHours: {
              $divide: [{ $subtract: ['$confirmedAt', '$createdAt'] }, 1000 * 60 * 60],
            },
            confirmedToPreparingHours: {
              $cond: [
                {
                  $and: [{ $ne: ['$preparingAt', null] }, { $gte: ['$preparingAt', '$confirmedAt'] }],
                },
                {
                  $divide: [{ $subtract: ['$preparingAt', '$confirmedAt'] }, 1000 * 60 * 60],
                },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: '$period',
            averageCreatedToConfirmedHours: { $avg: '$createdToConfirmedHours' },
            averageConfirmedToPreparingHours: { $avg: '$confirmedToPreparingHours' },

            createdToConfirmedCount: { $sum: 1 },
            confirmedToPreparingCount: {
              $sum: {
                $cond: [{ $ne: ['$confirmedToPreparingHours', null] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            averageCreatedToConfirmedHours: {
              $round: [{ $ifNull: ['$averageCreatedToConfirmedHours', 0] }, 1],
            },
            averageConfirmedToPreparingHours: {
              $round: [{ $ifNull: ['$averageConfirmedToPreparingHours', 0] }, 1],
            },
            createdToConfirmedCount: 1,
            confirmedToPreparingCount: 1,
          },
        },
        {
          $sort: { period: 1 },
        },
      ]);

      const statsMap = result.reduce(
        (acc, item) => {
          acc[item.period] = {
            averageCreatedToConfirmedHours: item.averageCreatedToConfirmedHours,
            averageConfirmedToPreparingHours: item.averageConfirmedToPreparingHours,
            createdToConfirmedCount: item.createdToConfirmedCount,
            confirmedToPreparingCount: item.confirmedToPreparingCount,
          };
          return acc;
        },
        {} as Record<
          string,
          {
            averageCreatedToConfirmedHours: number;
            averageConfirmedToPreparingHours: number;
            createdToConfirmedCount: number;
            confirmedToPreparingCount: number;
          }
        >,
      );

      const allPeriods = GeneratePeriods.execute(startDate, endDate, diffInDays);

      items = allPeriods.map((period) => {
        const createConfirmHours = statsMap[period]?.averageCreatedToConfirmedHours ?? 0;

        const confirmPrepareHours = statsMap[period]?.averageConfirmedToPreparingHours ?? 0;

        const createdToConfirmedCount = statsMap[period]?.createdToConfirmedCount ?? 0;

        const confirmedToPreparingCount = statsMap[period]?.confirmedToPreparingCount ?? 0;

        const createdToConfirmed =
          createConfirmHours >= 24
            ? {
                value: Number((createConfirmHours / 24).toFixed(1)),
                unit: 'day',
              }
            : {
                value: Number(createConfirmHours.toFixed(1)),
                unit: 'hour',
              };

        const confirmedToPreparing =
          confirmPrepareHours >= 24
            ? {
                value: Number((confirmPrepareHours / 24).toFixed(1)),
                unit: 'day',
              }
            : {
                value: Number(confirmPrepareHours.toFixed(1)),
                unit: 'hour',
              };

        return {
          period,
          AverageCreatedToConfirmedTime: createdToConfirmed,
          AverageCreatedToConfirmedCount: createdToConfirmedCount,
          AverageConfirmedToPreparingTime: confirmedToPreparing,
          AverageConfirmedToPreparingCount: confirmedToPreparingCount,
        };
      });

      await clientRedis.set(cacheKey, JSON.stringify(items), 24 * 60 * 60);

    }

      return context.send.data({
        items,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
