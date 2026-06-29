import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import {  SellerLeedsEntity, NotFoundError, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class SellerLeedsDetailResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  storeName: string;
  sphera: string;
  additionalInfo: string;
  comment: string;
  status: string;
  
  constructor(sellerLeed: SellerLeedsEntity) {
    this.id = sellerLeed.getId().toString();
    this.fullName = sellerLeed.getFullName();
    this.phoneNumber = sellerLeed.getPhoneNumber();
    this.storeName = sellerLeed.getStoreName();
    this.sphera = sellerLeed.getSphera();
    this.additionalInfo = sellerLeed.getAdditionalInfo();
    this.comment = sellerLeed.getComment();
    this.status = sellerLeed.getStatus();
  }
}

@prefix('/seller-leeds')
export default class SellerLeedDetailController {
  @request('get', '/detail/{sellerLeedId}')
  @summary('SellerLeed detail')
  @security([])
  @tags(['SellerLeeds'])
  @path({ sellerLeedId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.sellerLeedId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const foundSellerLeed = await Repository.SellerLeeds().getById(new Types.ObjectId(params.id));
      if (!foundSellerLeed) {
        throw new NotFoundError('SellerLeed');
      }
      const response = new SellerLeedsDetailResponse(foundSellerLeed);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
