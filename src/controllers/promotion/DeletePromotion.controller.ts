import { Context } from 'koa';
import { IdParams, UpdateSellerParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/promotion')
export default class DeletePromotionController {
  @request('delete', '/{promotionId}')
  @summary('Promotion delete')
  @security([])
  @tags(['Promotion'])
  @path({ promotionId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.promotionId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const beforePromotion = await Repository.Promotions().findOneRaw(new Types.ObjectId(params.id));

      if(!beforePromotion) {
        throw new NotFoundError('Promotion')
      }
      await Repository.Promotions().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Promotion',
        resourceId: new Types.ObjectId(params.id),
        before: beforePromotion,
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Promotion',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
