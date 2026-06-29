import { Context } from 'koa';
import { AddStoreParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, SellerStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/seller')
export default class DeleteSellerController {
  @request('delete', '/{sellerId}')
  @summary('Seller delete')
  @security([])
  @tags(['Seller'])
  @path({ sellerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.sellerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const seller = await Repository.Sellers().getById(new Types.ObjectId(params.id));
      if(!seller) {
        throw new NotFoundError('Seller')
      }
      const before = await Repository.Sellers().findOneRaw(new Types.ObjectId(params.id));

      seller.buildStatus(SellerStatusEnum.DELETED);
      const updated = await Repository.Sellers().update(seller);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Seller',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ deleted: true, id: params.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Seller',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
