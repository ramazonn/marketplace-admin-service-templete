import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/promocode')
export default class PromoStatsController {
  @request('get', '/{promoCodeId}/stats')
  @summary('Promocode usage stats')
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
      const usages = await Repository.PromoCodeUsages().list({}, { promo: new Types.ObjectId(params.id) });
      const items = usages.map((u) => ({ user: u.getUser(), usedCount: u.getUsedCount(), lastUsedAt: u.getLastUsedAt() }));
      return context.send.data({ items });
    } catch (error) {
      return context.send.error(error);
    }
  }
}


