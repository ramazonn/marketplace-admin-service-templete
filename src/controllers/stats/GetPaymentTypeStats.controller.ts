import { Context } from 'koa';
import { request, summary, security, tags, query, prefix } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { OrderModel, OrderStatusEnum, PaymentTypeEnum, Redis } from '@ubaytools/core';
import { GeneratePeriods } from '../../utils';

@prefix('/stats')
export default class GetPaymentTypeStatsController {
    @request('get', '/payment-types')
    @summary('Payment type statistics')
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
            const cacheData: any = await clientRedis.get(cacheKey);
            let response: any;
            const diffInDays =
                (params.endDate.getTime() - params.startDate.getTime()) /
                (1000 * 60 * 60 * 24);

            let dateFormat = "%Y-%m";
            if (diffInDays <= 30) {
                dateFormat = "%Y-%m-%d";
            }

            if(cacheData) {
                response = JSON.parse(cacheData);
            } else {
            const paymentTypes = Object.values(PaymentTypeEnum);

            const result = await OrderModel.aggregate([
                {
                    $match: {
                        deliveredAt: { $gte: params.startDate, $lte: params.endDate },
                        status: OrderStatusEnum.DELIVERED,
                    },
                },
                {
                    $group: {
                        _id: {
                            period: {
                                $dateToString: {
                                    format: dateFormat,
                                    date: "$deliveredAt",
                                },
                            },
                            paymentType: "$paymentType",
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$totalAmount" },
                    },
                },
                { $sort: { "_id.period": 1 } },
            ]);

            const statsMap = result.reduce((acc, item) => {
                const period = item._id.period;
                if (!acc[period]) acc[period] = {};
                acc[period][item._id.paymentType] = {
                    count: item.count,
                    totalAmount: item.totalAmount,
                };

                return acc;
            }, {} as Record<string, Record<string, { count: number; totalAmount: number }>>);

            const allPeriods = GeneratePeriods.execute(
                params.startDate,
                params.endDate,
                diffInDays
            );

            response = allPeriods.map(period => {
                const periodData: any = { date: period };

                paymentTypes.forEach(type => {
                    periodData[type] = {
                        count: statsMap[period]?.[type]?.count ?? 0,
                        totalAmount: statsMap[period]?.[type]?.totalAmount ?? 0,
                    };
                });

                return periodData;
            });

            await clientRedis.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
        }
            return context.send.data(response);

        } catch (error) {
            return context.send.error(error);
        }
    }

}
