import { prefix, query, request, security, summary, tags } from "koa-swagger-decorator";
import { RequiredDateFilterParams } from "../../infrastructure";
import { Context } from "koa";
import { DeliveryAddressTypeEnum, OrderModel, OrderStatusEnum, Redis } from "@ubaytools/core";
import { GeneratePeriods } from "../../utils";


@prefix('/stats')
export default class GetDeliveryTimeStatsController {
    @request('get', '/delivery-time')
    @summary('Average delivery time by months')
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


            const casheKey = `${process.env.NODE_ENV}:stats:delivery-time:` + `${params.startDate.toISOString().split('T')[0]}:` + `${params.endDate.toISOString().split('T')[0]}`;

            const clientRedis = await Redis.getInstance();
            const cacheData: any = await clientRedis.get(casheKey);
            let response: any;
            if(cacheData) {
                response = JSON.parse(cacheData);
            } else {

            const result = await OrderModel.aggregate([
                {
                    $match: {
                        status: OrderStatusEnum.DELIVERED,
                        deliveredAt: { $gte: params.startDate, $lte: params.endDate },
                        createdAt: { $ne: null },
                        $expr: { $gte: ["$deliveredAt", "$createdAt"] },
                        deliveryAddressType: {
                            $in: [
                                DeliveryAddressTypeEnum.DELIVERY_POINT,
                                DeliveryAddressTypeEnum.LOCATION
                            ]
                        }
                    }
                }
                ,
                {
                    $project: {
                        period: {
                            $dateToString: { format: "%Y-%m", date: "$deliveredAt" }
                        },
                        deliveryDays: {
                            $divide: [
                                { $subtract: ["$deliveredAt", "$createdAt"] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$period",
                        avgDeliveryDays: { $avg: "$deliveryDays" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        period: "$_id",
                        avgDeliveryDays: {
                            $round: ["$avgDeliveryDays", 1]
                        }
                    }
                },
                { $sort: { period: 1 } }
            ]);

            const statsMap = result.reduce((acc, item) => {
                acc[item.period] = item.avgDeliveryDays;
                return acc;
            }, {} as Record<string, number>);


            const allPeriods = GeneratePeriods.month(params.startDate, params.endDate);

            response = allPeriods.map(period => ({
                month: period,
                averageDeliveryDays: statsMap[period] ?? 0
            }));

            await clientRedis.set(casheKey, JSON.stringify(response), 24 * 60 * 60);
        }

            return context.send.data(response);

        } catch (error) {
            return context.send.error(error);
        }
    }
}