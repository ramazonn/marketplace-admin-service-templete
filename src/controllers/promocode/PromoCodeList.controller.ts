import { Context } from 'koa';
import { PromoListParams } from '../../infrastructure';
import { Repository, PromoCodeEntity, TranslatesSchema, NotFoundError } from '@ubaytools/core';
import { query, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class PromoCodeListItemResponse {
  id: string;
  code: string;
  description: TranslatesSchema;
  type: string;
  value: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usedCount: number;

  constructor(promo: PromoCodeEntity) {
    this.id = promo.getId().toString();
    this.code = promo.getCode();
    this.description = promo.getDescription()?.convertToSchema();
    this.type = promo.getType();
    this.value = promo.getValue();
    this.isActive = promo.getIsActive();
    this.startDate = promo.getStartDate();
    this.endDate = promo.getEndDate();
    this.usedCount = promo.getUsedCount();
  }
}

@prefix('/promocode')
export default class PromoListController {
  @request('get', '/list')
  @summary('Promocode list')
  @security([])
  @tags(['Promocode'])
  @query((PromoListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: PromoListParams;
    try {
      params = await new PromoListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {};
      if (context.seller && params.store) {
        console.log('Seller provided store filter:', params.store);
        const store = await Repository.Stores().getById(new Types.ObjectId(params.store));
        if (!store) {
          throw new NotFoundError('Store');
        }
        const seller = store.getSeller() as any;
        
        if (seller?.getId()?.toString() !== context.seller.toString()) {
          throw new NotFoundError('Store');
        }
        filter.store = params.store;
      }

      if (params.isActive !== undefined) filter['isActive'] = params.isActive;
      if (params.type) filter['type'] = params.type;
      const count = await Repository.PromoCodes().countDocumentsByFilter(filter);
      const items = await Repository.PromoCodes().list({ page: params.page, size: params.size }, filter);
      const response = items.map((i) => new PromoCodeListItemResponse(i));
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
