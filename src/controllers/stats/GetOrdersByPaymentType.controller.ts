import { OrderModel, PaymentTypeEnum, Redis } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query } from 'koa-swagger-decorator';

import { RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetOrdersByPaymentTypeController {
  @request('get', '/orders-by-payment-type')
  @summary('Orders by payment type statistics')
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

      const clientRedis = await Redis.getInstance();
      const cacheKey = `${process.env.NODE_ENV}:stats:orders-by-payment-type:` + `${params.startDate.toISOString().split('T')[0]}:` + `${params.endDate.toISOString().split('T')[0]}`;

      
      let response: any;
      
      const diffInDays = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      let dateFormat = '%Y-%m';
      
      if (diffInDays <= 30) {
        dateFormat = '%Y-%m-%d';
      }
      
      const cacheData: any = await clientRedis.get(cacheKey);

      if(cacheData) {
        response = JSON.parse(cacheData);
      } else {
      const result = await OrderModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: params.startDate,
              $lte: params.endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              period: {
                $dateToString: {
                  format: dateFormat,
                  date: '$createdAt',
                },
              },
            },

            imanCount: {
              $sum: {
                $cond: [{ $eq: ['$paymentType', PaymentTypeEnum.IMAN_PAY] }, 1, 0],
              },
            },

            imanTotalAmount: {
              $sum: {
                $cond: [{ $eq: ['$paymentType', PaymentTypeEnum.IMAN_PAY] }, '$totalAmount', 0],
              },
            },

            cashCount: {
              $sum: {
                $cond: [{ $ne: ['$paymentType', PaymentTypeEnum.IMAN_PAY] }, 1, 0],
              },
            },

            cashTotalAmount: {
              $sum: {
                $cond: [{ $ne: ['$paymentType', PaymentTypeEnum.IMAN_PAY] }, '$totalAmount', 0],
              },
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

      const statsMap = result.reduce(
        (acc, item) => {
          acc[item._id.period] = {
            imanCount: item.imanCount,
            imanTotalAmount: item.imanTotalAmount,

            cashCount: item.cashCount,
            cashTotalAmount: item.cashTotalAmount,
          };

          return acc;
        },
        {} as Record<
          string,
          {
            imanCount: number;
            imanTotalAmount: number;
            cashCount: number;
            cashTotalAmount: number;
          }
        >,
      );

      response = allPeriods.map((period) => {
        const stat = statsMap[period];

        const imanCount = stat?.imanCount ?? 0;
        const imanTotalAmount = stat?.imanTotalAmount ?? 0;

        const cashCount = stat?.cashCount ?? 0;
        const cashTotalAmount = stat?.cashTotalAmount ?? 0;

        return {
          period,

          iman: {
            count: imanCount,
            totalAmount: imanTotalAmount,
            avgOrderPrice: imanCount > 0 ? Math.round(imanTotalAmount / imanCount) : 0,
          },

          other: {
            count: cashCount,
            totalAmount: cashTotalAmount,
            avgOrderPrice: cashCount > 0 ? Math.round(cashTotalAmount / cashCount) : 0,
          },
        };
      });

      await clientRedis.set(cacheKey, JSON.stringify(response), 60 * 60);
    }
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
