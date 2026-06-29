import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/store-cashback-rule')
export default class DeleteStoreCashbackRuleController {
  @request('delete', '/{storeCashbackRuleId}')
  @summary('StoreCashbackRule delete')
  @security([])
  @tags(['StoreCashbackRule'])
  @path({ storeCashbackRuleId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.storeCashbackRuleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const rule = await Repository.StoreCashbackRules().getById(new Types.ObjectId(params.id));
      if (!rule) {
        throw new NotFoundError('StoreCashbackRule');
      }
      const before = await Repository.StoreCashbackRules().findOneRaw(new Types.ObjectId(params.id))
      await Repository.StoreCashbackRules().delete(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'StoreCashbackRule',
        resourceId: new Types.ObjectId(params.id),
        before,
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'StoreCashbackRule',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

