import { Context } from 'koa';
import { AuthorizationError, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, PromoCodeOwnerTypeEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/promocode')
export default class DeletePromoCodeController {
  @request('delete', '/{promoCodeId}')
  @summary('Promocode delete')
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
      const before = await Repository.PromoCodes().findOneRaw(new Types.ObjectId(params.id));
      if (!before) {
        throw new NotFoundError('Promocode');
      }
      if (context.seller) {
        const stores = await Repository.Stores().list({ page: 1, size: 1000 }, { seller: context.seller });

        const storeIds = new Set(stores.map((s) => s.getId().toString()));

        if (before.ownerType !== PromoCodeOwnerTypeEnum.STORE || !before.store || !storeIds.has(before.store.toString())) {
          throw new NotFoundError('Promocode');
        }
      }
      await Repository.PromoCodes().delete(new Types.ObjectId(params.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Promocode',
        resourceId: new Types.ObjectId(params.id),
        before: before,
      });

      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Promocode',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
