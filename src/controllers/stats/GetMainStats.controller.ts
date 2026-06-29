import { Context } from 'koa';
import { DateFilterParams, ListParams } from '../../infrastructure';
import {
  BrandsEntity,
  CloudFlareService,
  LanguageEnum,
  OrderEntity,
  OrderModel,
  OrderStatusEnum,
  ProductStatsEntity,
  ProductStatusEnum,
  Redis,
  Repository,
  UserStatusEnum,
} from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { FilterQuery, PipelineStage } from 'mongoose';
import { MainStatsParams } from '../../infrastructure/params/MainStatsParams';
class BrandResponse {
  id: string;
  title: string;
  desc: string;
  avatar: string;
  constructor(brand: BrandsEntity, lang: LanguageEnum) {
    this.id = brand.getId().toString();
    this.title = brand.getTitle()?.getByLang(lang);
    this.desc = brand.getDesc()?.getByLang(lang);
    this.avatar = brand.getAvatar() ? CloudFlareService.getImageUrlByFileID(brand.getAvatar()) : null;
  }
}

@prefix('/stats')
export default class GetMainStatsController {
  @request('get', '/main')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @query((MainStatsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: MainStatsParams;
    try {
      params = await new MainStatsParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {};
      
      let cacheKey =`${process.env.NODE_ENV}:stats:main:`;

      if (params.storeId) {
        cacheKey += `store:${params.storeId}:`;
        filter.store = params.storeId;
      }


      const redisClient = await Redis.getInstance();
      
      let cacheMain = await redisClient.get(cacheKey);
      let result: any;

      if (cacheMain) {
        result = JSON.parse(cacheMain);
      } else {
        const ordersCount = await Repository.Orders().countDocumentsByFilter({
          status: OrderStatusEnum.DELIVERED,
          ...filter,
        });

        const productsCount = await Repository.Products().countDocumentsByFilter({
          status: { $ne: ProductStatusEnum.DELETED },
          ...filter,
        });

        let usersCount: number | undefined;

        if (!params.storeId) {
          usersCount = await Repository.Users().countDocumentsByFilter({
            status: UserStatusEnum.ACTIVE,
          });
        }

        const orderTotalAmountSumPipline: PipelineStage[] = [
          {
            $match: {
              status: OrderStatusEnum.DELIVERED,
              ...filter,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$totalAmount',
              },
            },
          },
        ];

        const orderTotalAmountSum = await OrderModel.aggregate(orderTotalAmountSumPipline);

        const totalIncome = orderTotalAmountSum.length > 0 ? orderTotalAmountSum[0].totalRevenue : 0;

        result = {
          ordersCount,
          productsCount,
          totalIncome,
        };

        if (!params.storeId) {
          result.usersCount = usersCount;
        }

        await redisClient.set(cacheKey, JSON.stringify(result), 60 * 60);
      }

      return context.send.data({
        data: result,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
