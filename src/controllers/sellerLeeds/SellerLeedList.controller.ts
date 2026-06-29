import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { SellerLeedsEntity, Repository, SellerLeedStatusEnum } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { SellerLeedListParams } from '../../infrastructure/params/SellerLeedList.params';

class SellerLeedsResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  storeName: string;
  sphera: string;
  additionalInfo: string;
  comment: string;
  status: SellerLeedStatusEnum;
  
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
export default class SellerLeedListController {
  @request('get', '/list')
  @summary('SellerLeed list')
  @security([])
  @tags(['SellerLeeds'])
  @query((SellerLeedListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SellerLeedListParams;
    try {
      params = await new SellerLeedListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.SellerLeeds().countDocumentsByFilter({});
      const filter :any= {}
      if (params.status) {
        filter.status = params.status
      }
      const sellerLeeds = await Repository.SellerLeeds().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      const result = sellerLeeds.map((sellerLeed) => new SellerLeedsResponse(sellerLeed));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
