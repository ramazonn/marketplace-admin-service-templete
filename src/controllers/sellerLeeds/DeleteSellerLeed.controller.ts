import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/seller-leeds')
export default class DeleteSellerLeedController {
  @request('delete', '/{sellerLeedId}')
  @summary('SellerLeed delete')
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
      const before = await Repository.SellerLeeds().findOneRaw(new Types.ObjectId(params.id));
      if(!before) {
        throw new NotFoundError('SellerLeed')
      }
      await Repository.SellerLeeds().deleteById(new Types.ObjectId(params.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'SellerLeed',
        resourceId: new Types.ObjectId(params.id),
        before,
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'SellerLeed',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
