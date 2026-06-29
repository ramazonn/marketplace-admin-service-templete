import { Context } from 'koa';
import { IdParams, UpdatePromoCodeParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/promocode')
export default class UpdatePromoController {
  @request('put', '/{promoCodeId}')
  @summary('Promocode update')
  @security([])
  @tags(['Promocode'])
  @path({ promoCodeId: { type: 'string', required: true } })
  @body((UpdatePromoCodeParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdatePromoCodeParams;
    try {
      idParams = await new IdParams({ id: context.params.promoCodeId }).validate();
      params = await new UpdatePromoCodeParams(context.request.body).validate();
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

      const before = await Repository.PromoCodes().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.code) promoCode.buildCode(params.code);
      if (params.description) promoCode.buildDescription(params.description);
      if (params.type) promoCode.buildType(params.type);
      if (params.value !== undefined) promoCode.buildValue(params.value);
      if (params.startDate) promoCode.buildStartDate(new Date(params.startDate));
      if (params.endDate) promoCode.buildEndDate(new Date(params.endDate));
      if (params.usageLimit !== undefined) promoCode.buildUsageLimit(params.usageLimit as any);
      if (params.perUserLimit !== undefined) promoCode.buildPerUserLimit(params.perUserLimit as any);

      const after = await Repository.PromoCodes().update(promoCode);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Promocode',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Promocode',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
