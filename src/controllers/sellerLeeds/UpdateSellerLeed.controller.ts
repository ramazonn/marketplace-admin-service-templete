import { Context } from 'koa';
import { IdParams, AddLifehackParams, UpdateLifehackParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { UpdateSellerLeedParams } from '../../infrastructure/params/UpdateSellerLeed.params';
import { ActionLogService } from '../../services';

@prefix('/seller-leeds')
export default class UpdateSellerLeedController {
  @request('put', '/{sellerLeedId}')
  @summary('SellerLeed update')
  @security([])
  @tags(['SellerLeeds'])
  @path({ sellerLeedId: { type: 'string', required: true } })
  @body((UpdateSellerLeedParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateSellerLeedParams;
    try {
      console.log(context.params.sellerLeedId);

      idParams = await new IdParams({ id: context.params.sellerLeedId }).validate();
      params = await new UpdateSellerLeedParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const sellerLeed = await Repository.SellerLeeds().getById(new Types.ObjectId(idParams.id));
      if (!sellerLeed) {
        throw new NotFoundError('SellerLeed');
      }
      const before = await Repository.SellerLeeds().findOneRaw(new Types.ObjectId(idParams.id));

      sellerLeed.buildComment(params.comment);
      if (params.status) sellerLeed.buildStatus(params.status);

      const after = await Repository.SellerLeeds().update(sellerLeed);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'SellerLeed',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });

      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'SellerLeed',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
