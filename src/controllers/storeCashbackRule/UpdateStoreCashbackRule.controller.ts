import { Context } from 'koa';
import { IdParams, UpdateStoreCashbackRuleParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, StoreCashbackRulesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/store-cashback-rule')
export default class UpdateStoreCashbackRuleController {
  @request('put', '/{storeCashbackRuleId}')
  @summary('StoreCashbackRule update')
  @security([])
  @tags(['StoreCashbackRule'])
  @path({ storeCashbackRuleId: { type: 'string', required: true } })
  @body((UpdateStoreCashbackRuleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateStoreCashbackRuleParams;
    let idParams: IdParams;
    try {
      params = await new UpdateStoreCashbackRuleParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.storeCashbackRuleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const rule = await Repository.StoreCashbackRules().getById(new Types.ObjectId(idParams.id));
      if (!rule) {
        throw new NotFoundError('StoreCashbackRule');
      }

      const before = await Repository.StoreCashbackRules().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.storeId) {
        rule.buildStoreId(new Types.ObjectId(params.storeId));
      }
      if (params.amount !== undefined) {
        rule.buildAmount(params.amount);
      }
      if (params.lowerPercent !== undefined) {
        rule.buildLowerPercent(params.lowerPercent);
      }
      if (params.upperPercent !== undefined) {
        rule.buildUpperPercent(params.upperPercent);
      }

      const after = await Repository.StoreCashbackRules().update(rule);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'StoreCashbackRule',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ updated: true, id: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'StoreCashbackRule',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

