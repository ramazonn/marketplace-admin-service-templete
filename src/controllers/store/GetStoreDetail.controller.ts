import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { LanguageEnum, NotFoundError, SocialTypeEnum, StoresModel, StoreStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { PipelineStage } from 'mongoose';
import { StoreCashbackConfigSchema } from '@ubaytools/core/typings/database/schemas/stores/StoreCashbackConfig.schema';

export class StoreDetailsResponse {
  id: string;
  name: string;
  description: string | TranslatesSchema;
  sku: string;
  seller: { id: string; fullName: string };
  status: StoreStatusEnum;
  createdAt: Date;
  countOfProducts: number;
  rate: number;
  avatar: string;
  cover_banner: string;
  cover_mobile_banner: string;
  social_links: { type: SocialTypeEnum; link: string }[];
  usd_rate: number;
  avgStarts: number | null;
  cashbackConfig: StoreCashbackConfigSchema;

  constructor(store: any, lang: LanguageEnum) {
    this.id = store.id || store._id?.toString();
    this.name = store.name;
    this.description = store.description?.convertToSchema ? store.description.convertToSchema() : store.description;
    this.sku = store.sku || store.shortName;
    this.seller = {
      id: store.sellerInfo?._id?.toString() || store.seller?.getId?.()?.toString(),
      fullName: store.sellerInfo?.fullName || store.seller?.getFullname?.(),
    };
    this.status = store.status;
    this.createdAt = store.createdAt;
    this.countOfProducts = store.countOfProducts || 0;
    this.rate = store.rate;
    this.avatar = store.avatar;
    this.cover_banner = store.cover_banner || store.coverBanner;
    this.cover_mobile_banner = store.cover_mobile_banner || store.coverMobileBanner;
    this.social_links = store.social_links || store.socialLinks || [];
    this.usd_rate = store.usd_rate;
    this.avgStarts = store.avgStarts;
    this.cashbackConfig = store?.cashbackConfig ?? {};
  }
}

@prefix('/store')
export default class GetStoreDetailController {
  @request('get', '/detail/{storeId}')
  @summary('Selected Store detail')
  @security([])
  @tags(['Store'])
  @path({ storeId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.storeId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const sellerId = context.auth?.seller;

      const match: any = {
        _id: new Types.ObjectId(params.id),
        status: { $ne: StoreStatusEnum.DELETED },
      };

      if (sellerId) {
        match.seller = new Types.ObjectId(sellerId);
      }
      const pipeline: PipelineStage[] = [
        {
          $match: match
        },
        {
          $lookup: {
            from: 'sellers',
            localField: 'seller',
            foreignField: '_id',
            as: 'sellerInfo',
          },
        },
        {
          $unwind: '$sellerInfo',
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'store',
            as: 'products',
          },
        },
        {
          $addFields: {
            countOfProducts: {
              $size: {
                $filter: {
                  input: '$products',
                  as: 'product',
                  cond: { $ne: ['$$product.status', 'DELETED'] },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'reviews',
            localField: 'products._id',
            foreignField: 'product',
            as: 'reviews',
          },
        },
        {
          $addFields: {
            avgStarts: {
              $cond: {
                if: { $gt: [{ $size: '$reviews' }, 0] },
                then: {
                  $round: [
                    {
                      $divide: [{ $sum: '$reviews.stars' }, { $size: '$reviews' }],
                    },
                    1,
                  ],
                },
                else: null,
              },
            },
          },
        },
      ];

      const result = await StoresModel.aggregate(pipeline);
      const store = result[0];

      if (!store) {
        throw new NotFoundError('Store');
      }

      const response = new StoreDetailsResponse(store, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
