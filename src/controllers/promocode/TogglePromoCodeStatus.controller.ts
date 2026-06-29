import { Context } from 'koa';
import { IdParams, TogglePromoStatusParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/promocode')
export default class TogglePromoStatusController {
  @request('put', '/{promoCodeId}/status')
  @summary('Promocode toggle status')
  @security([])
  @tags(['Promocode'])
  @path({ promoCodeId: { type: 'string', required: true } })
  @body((TogglePromoStatusParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: TogglePromoStatusParams;
    try {
      idParams = await new IdParams({ id: context.params.promoCodeId }).validate();
      params = await new TogglePromoStatusParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const promoCode = await Repository.PromoCodes().getById(new Types.ObjectId(idParams.id));
      if (!promoCode) throw new NotFoundError('Promocode');

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
      
      promoCode.buildIsActive(params.isActive);
      await Repository.PromoCodes().update(promoCode);
      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
