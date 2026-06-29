import { prefix, query, request, security, summary, tags } from "koa-swagger-decorator";
import { RequiredDateFilterParams } from "../../infrastructure";
import { Context } from "koa";
import { OrderModel, OrderStatusEnum, Redis } from "@ubaytools/core";
import { GeneratePeriods } from "../../utils";

@prefix("/stats")
export default class GetMonthlySalesStatsController {
    @request("get", "/monthly-store-brand-sales")
    @summary("Monthly sales statistics by stores and brands")
    @security([])
    @tags(["Statistics"])
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
            const startDate = new Date(params.startDate);
            const endDate = new Date(params.endDate);
            const cacheKey = `${process.env.NODE_ENV}:stats:monthly-store-brand-sales:` + `${startDate.toISOString().split('T')[0]}:` + `${endDate.toISOString().split('T')[0]}`;
            const cacheData: any = await redisClient.get(cacheKey);
            let response: any;
            if (cacheData) {
                response = JSON.parse(cacheData);
            } else {
            const matchStage = {
                status: OrderStatusEnum.DELIVERED,
                deliveredAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };
            const [storeStats, brandStats] = await Promise.all([
                OrderModel.aggregate([
                    {
                        $match: matchStage,
                    },
                    {
                        $unwind: "$items",
                    },
                    {
                        $match: {
                            "items.storeId": { $nin: [null, ""] },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                period: {
                                    $dateToString: {
                                        format: "%Y-%m",
                                        date: "$deliveredAt",
                                    },
                                },
                                storeId: "$items.storeId",
                            },
                            salesAmount: {
                                $sum: {
                                    $multiply: [
                                        { $ifNull: ["$items.finalPrice", "$items.price"] },
                                        { $ifNull: ["$items.quantity", 0] },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "stores",
                            let: {
                                storeObjectId: { $toObjectId: "$_id.storeId" },
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$_id", "$$storeObjectId"],
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        name: 1,
                                    },
                                },
                            ],
                            as: "store",
                        },
                    },
                    {
                        $unwind: {
                            path: "$store",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            period: "$_id.period",
                            storeId: "$_id.storeId",
                            storeName: "$store.name",
                            salesAmount: { $round: ["$salesAmount", 2] },
                        },
                    },
                    {
                        $sort: {
                            period: 1,
                            salesAmount: -1,
                        },
                    },
                ]),

                OrderModel.aggregate([
                    {
                        $match: matchStage,
                    },
                    {
                        $unwind: "$items",
                    },
                    {
                        $match: {
                            "items.brand": { $nin: [null, ""] },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                period: {
                                    $dateToString: {
                                        format: "%Y-%m",
                                        date: "$deliveredAt",
                                    },
                                },
                                brandName: "$items.brand",
                            },
                            salesAmount: {
                                $sum: {
                                    $multiply: [
                                        { $ifNull: ["$items.finalPrice", "$items.price"] },
                                        { $ifNull: ["$items.quantity", 0] },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            period: "$_id.period",
                            brandName: "$_id.brandName",
                            salesAmount: { $round: ["$salesAmount", 2] },
                        },
                    },
                    {
                        $sort: {
                            period: 1,
                            salesAmount: -1,
                        },
                    },
                ]),
            ]);
            const periods = GeneratePeriods.month(startDate, endDate);
            const storeMap = (storeStats as any[]).reduce(
                (acc, item) => {
                    if (!acc[item.period]) {
                        acc[item.period] = [];
                    }
                    acc[item.period].push({
                        storeId: item.storeId,
                        storeName: item.storeName ?? null,
                        salesAmount: item.salesAmount,
                    });
                    return acc;
                },
                {} as Record<string, any[]>
            );
            const brandMap = (brandStats as any[]).reduce(
                (acc, item) => {
                    if (!acc[item.period]) {
                        acc[item.period] = [];
                    }

                    acc[item.period].push({
                        brandName: item.brandName,
                        salesAmount: item.salesAmount,
                    });

                    return acc;
                },
                {} as Record<string, any[]>
            );
            const items = periods.map((period) => ({
                period,
                stores: storeMap[period] ?? [],
                brands: brandMap[period] ?? [],
            }));
            response = { items };
            await redisClient.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
        }
            return context.send.data(response);
        } catch (error) {
            return context.send.error(error);
        }
    }
}