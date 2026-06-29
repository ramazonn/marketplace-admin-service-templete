import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, PromoCodeEntity, TranslatesSchema } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

export class PromoCodeResponse {
  id: string;
  code: string;
  description: TranslatesSchema;
  type: string;
  value: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  perUserLimit: number;
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
    this.usageLimit = promo.getUsageLimit();
    this.perUserLimit = promo.getPerUserLimit();
    this.usedCount = promo.getUsedCount();
  }
}

@prefix('/promocode')
export default class GetPromoByIdController {
  @request('get', '/detail/{promoCodeId}')
  @summary('Promocode get by id')
  @security([])
  @tags(['Promocode'])
  @path({ promoCodeId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.promoCodeId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const promoCode = await Repository.PromoCodes().getById(new Types.ObjectId(params.id));

      if (!promoCode) {
        throw new NotFoundError('Promocode');
      }

      if (context.seller && promoCode.getStore()) {
        const store = await Repository.Stores().getById(promoCode.getStore() as Types.ObjectId);

        if (!store) {
          throw new NotFoundError('Store');
        }

        const seller = store.getSeller() as any;
        if (seller?._id?.toString() !== context.seller.toString()) {
          throw new NotFoundError('Promocode');
        }
      }
      const response = new PromoCodeResponse(promoCode);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
