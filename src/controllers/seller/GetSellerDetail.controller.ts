import { Context } from 'koa';
import { AddStoreParams, IdParams } from '../../infrastructure';
import { AdminsSchema, NotFoundError, Repository, SellersEntity, StoresEntity, StoresModel } from '@ubaytools/core';
import { PipelineStage, Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

export class SellerDetailResponse {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName: string;
  phoneNumber: string;
  admin: Types.ObjectId | AdminsSchema
  createdAt: Date;
  status: string;
  countOfProducts: number; // TODO implement this part
  stores: Array<{ id: string; storeName: string; productCount: number }>; // TODO implement this
  passport: string;
  bankMFO: string;
  bankAccount: string;
  address: string;

  constructor(seller: SellersEntity, stores: Array<{ id: string; storeName: string; productCount: number }>, productCount: number = 0) {
    this.id = seller.getId().toString();
    this.type = seller.getType();
    this.firstName = seller.getFirstname();
    this.lastName = seller.getLastname();
    this.middleName = seller.getMiddlename();
    this.fullName = seller.getFullname() ?? seller.getLastname() + ' ' + seller.getFirstname() + ' ' + seller.getMiddlename();
    this.createdAt = seller.getCreatedAt();
    this.status = seller.getStatus();
    this.countOfProducts = productCount;
    this.stores = stores??[];
    this.phoneNumber = seller.getPhonenumber();
    this.admin = seller.getAdmin() as Types.ObjectId;
    this.passport = seller.getPassportFullNumber();
    this.bankAccount = seller.getBankAccount();
    this.bankMFO = seller.getBankMFO();
    this.address = seller.getAddress();
  }
}

@prefix('/seller')
export default class GetSellerDetailController {
  @request('get', '/detail/{sellerId}')
  @summary('Seller detail')
  @security([])
  @tags(['Seller'])
  @path({ sellerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.sellerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const seller = await Repository.Sellers().getById(new Types.ObjectId(params.id));
      if (!seller) {
        throw new NotFoundError('Seller');
      }
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
      const response = new SellerDetailResponse(seller, storesWithProductCount, productCount);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
