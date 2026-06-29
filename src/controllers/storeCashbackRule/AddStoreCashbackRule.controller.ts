import { Context } from 'koa';
import { AddStoreCashbackRuleParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BaseError, NotFoundError, Repository, StoreCashbackRulesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/store-cashback-rule')
export default class AddStoreCashbackRuleController {
  @request('post', '/add')
  @summary('StoreCashbackRule add')
  @security([])
  @tags(['StoreCashbackRule'])
  @body((AddStoreCashbackRuleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddStoreCashbackRuleParams;
    try {
      params = await new AddStoreCashbackRuleParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const store = await Repository.Stores().getById(new Types.ObjectId(params.storeId));
      if (!store) {
        throw new NotFoundError('Store');
      }
      const previousRule = (await Repository.StoreCashbackRules().list({ page: 1, size: 1 }, { storeId: new Types.ObjectId(params.storeId), amount: { $lte: params.amount } }, { amount: -1 }))[0];

      if (previousRule && previousRule.getAmount() === params.amount) {
        throw new BaseError('StoreCashbackRule already exists', {
          en: `StoreCashbackRule already exists`,
          ru: `StoreCashbackRule already exists`,
          uz: `StoreCashbackRule already exists`
        }, 400);
      } else if (previousRule && previousRule.getUpperPercent() !== params.lowerPercent) {
        throw new BaseError(`Lower percent must be equal to previous rule's upper percent`, {
          en: `Lower percent must be equal to previous rule's upper percent`,
          ru: `Lower percent must be equal to previous rule's upper percent`,
          uz: `Lower percent must be equal to previous rule's upper percent`
        }, 400);
      }

      const rule = new StoreCashbackRulesEntity()
        .buildStoreId(new Types.ObjectId(params.storeId))
        .buildAmount(params.amount)
        .buildLowerPercent(params.lowerPercent)
        .buildUpperPercent(params.upperPercent);

      const created = await Repository.StoreCashbackRules().create(rule);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'StoreCashbackRule',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'StoreCashbackRule',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

