import { Context } from 'koa';
import { StoreListParams } from '../../infrastructure';
import { LanguageEnum, Repository, SellersEntity, StoreCashbackConfigSchema, StoresEntity, StoresModel, StoreStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { body, header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import * as moment from 'moment';
import { PipelineStage, Types } from 'mongoose';

export class StoreListItemResponse {
  id: string;
  name: string;
  description: string;
  sku: string;
  seller: { id: string; sellerName: string };
  status: StoreStatusEnum;
  createdAt: Date;
  countOfProducts: number;
  rate: number;
  avatar: string;
  usd_rate: number;
  avgStarts: number | null;
  cashbackConfig: StoreCashbackConfigSchema
  constructor(store: any, lang: LanguageEnum) {
    this.id = store.id;
    this.name = store.name;
    this.description = store.description['uz']; // TODO getByLang implement
    this.sku = store.sku;
    this.seller = { id: store.sellerInfo?.['_id'], sellerName: store.sellerInfo?.fullName };
    this.status = store.status;
    this.createdAt = store.createdAt;
    this.countOfProducts = store.countOfProducts || 0;
    this.rate = store.rate;
    this.avatar = store.avatar;
    this.usd_rate = store.usd_rate;
    this.avgStarts = store.avgStarts;
    this.cashbackConfig = store?.cashbackConfig ?? {}
  }
}

@prefix('/store')
export default class StoreListController {
  @request('get', '/list')
  @summary('Store list')
  @security([])
  @tags(['Store'])
  @query((StoreListParams as any).swaggerDocument)
  @header({ 'content-language': { type: 'string', example: LanguageEnum.UZ, description: 'values: ' + Object.values(LanguageEnum).join(' | ') } })
  static async controller(context: Context): Promise<void> {
    let params: StoreListParams;
    try {
      params = await new StoreListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const sellerId = context.auth?.seller;
      
      const filter = { status: 'ACTIVE' };
      if (params.sellerName) filter['sellerInfo.fullName'] = params.sellerName;
      if (params.createdAt) {
        filter['createdAt'] = { $gte: moment(params.createdAt).toDate(), $lte: moment(params.createdAt).add(1, 'd').toDate() };
      }
      if (params.rate) filter['rate'] = params.rate;
      if (params.search) {
        filter['$or'] = [{ name: { $regex: params.search, $options: 'i' } }];
      }

      if (sellerId) {
        filter['seller'] = new Types.ObjectId(sellerId);
      }
      
      // TODO filter by counfOfProducts
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'sellers', // This should match the seller collection name
            localField: 'seller', // Field in Store that refers to Seller
            foreignField: '_id', // Field in Seller schema
            as: 'sellerInfo',
          },
        },
        {
          $unwind: '$sellerInfo', // Flatten the seller data
        },
        {
          $lookup: {
            from: 'products', // Assuming 'products' is the name of your products collection
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
            from: 'reviews', // Collection name for reviews
            localField: 'products._id', // Field in products that refers to reviews
            foreignField: 'product', // Field in Review schema that references product
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
                      $divide: [
                        { $sum: '$reviews.stars' },
                        { $size: '$reviews' }
                      ]
                    },
                    1
                  ]
                },
                else: null
              }
            },
          },
        },
        {
          $match: filter,
        },
        {
          $facet: {
            totalCount: [
              {
                $count: 'total', // Count the total matching documents
              },
            ],
            paginationResult: [
              {
                $project: {
                  id: '$_id',
                  name: 1,
                  description: 1,
                  sku: '$shortName',
                  status: 1,
                  createdAt: 1,
                  avatar: 1,
                  rate: 1,
                  'sellerInfo.fullName': 1,
                  'sellerInfo._id': 1,
                  countOfProducts: 1,
                  usd_rate: 1,
                  avgStarts: 1,
                  cashbackConfig:1
                },
              },
              { $sort: { createdAt: -1 } },
              {
                $skip: (params.page - 1) * params.size, // Skip documents for pagination
              },
              {
                $limit: params.size, // Limit the results for pagination
              },
            ],
          },
        },
      ];
      // TODO rate, countOfProducts
      const result = await StoresModel.aggregate(pipeline);
      const response = result[0]?.paginationResult?.map((item) => new StoreListItemResponse(item, context.lang));
      return context.send.data({ total: result[0]?.totalCount[0]?.total, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
