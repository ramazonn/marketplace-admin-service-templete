import { SellerListParams } from '../../infrastructure';
import { Context } from 'koa';
import { CharacterStatusEnum, Repository, SellerStatusEnum, StoresModel } from '@ubaytools/core';
import { SellerDetailResponse } from './GetSellerDetail.controller';
import { body, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { PipelineStage, Types } from 'mongoose';

@prefix('/seller')
export default class SellerListController {
  @request('get', '/list')
  @summary('Seller list')
  @security([])
  @tags(['Seller'])
  @query((SellerListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SellerListParams;
    try {
      params = await new SellerListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = { status: { $ne: SellerStatusEnum.DELETED } }; // TODO add productCount filter option
      if (params.phoneNumber) filter.phoneNumber = params.phoneNumber;
      if (params.status) filter.status = params.status;
      if (params.fullName) filter.fullName = { $regex: params.fullName };
      if (params.search) {
        filter['$or'] = [
          { fullName: { $regex: params.search, $options: 'i' } },
          { firstName: { $regex: params.search, $options: 'i' } },
          { lastName: { $regex: params.search, $options: 'i' } },
          { passportNumber: { $regex: params.search, $options: 'i' } },
          { address: { $regex: params.search, $options: 'i' } },
          { bankAccount: { $regex: params.search, $options: 'i' } },
          { bankMFO: { $regex: params.search, $options: 'i' } },
        ];
      }
      const count = await Repository.Sellers().countDocumentsByFilter(filter);
      const sellers = await Repository.Sellers().list({ page: params.page, size: params.size }, { $and: [filter] }, { createdAt: -1 });
      const response = await Promise.all(
        sellers.map(async (seller) => {
          const pipeline: PipelineStage[] = [
            { $match: { seller: seller.getId() } },
            {
              $lookup: {
                from: 'products', // Assuming your products collection name
                localField: '_id',
                foreignField: 'store',
                pipeline: [
                  { 
                    $match: { 
                      // $expr: { $eq: ['$store', '$$storeId'] }, 
                      status: { $ne: 'DELETED' } 
                    } 
                  }
                ],
                as: 'products'
              }
            },
            {
              $project: {
                _id:0,
                id: { $toString: '$_id' },
                storeName: '$name',
                productCount: { $size: '$products' }
              }
            }
          ];
          const storesWithProductCount = await StoresModel.aggregate(pipeline);
          let productCount = 0
          storesWithProductCount.forEach(item => productCount += item.productCount)

          return new SellerDetailResponse(seller, storesWithProductCount, productCount);
        }),
      );
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
