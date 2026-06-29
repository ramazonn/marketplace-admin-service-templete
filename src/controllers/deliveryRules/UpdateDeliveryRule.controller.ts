import { Context } from 'koa';
import { IdParams, UpdateDeliveryRuleParams } from '../../infrastructure';
import { BaseError, NotFoundError, Repository, DeliveryRulesEntity, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/delivery-rules')
export default class UpdateDeliveryRuleController {
  @request('put', '/{deliveryRuleId}')
  @summary('DeliveryRule update')
  @security([])
  @tags(['DeliveryRules'])
  @path({ deliveryRuleId: { type: 'string', required: true } })
  @body((UpdateDeliveryRuleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateDeliveryRuleParams;
    let idParams: IdParams;
    try {
      params = await new UpdateDeliveryRuleParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.deliveryRuleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const rule = await Repository.DeliveryRules().getById(new Types.ObjectId(idParams.id));
      if (!rule) {
        throw new NotFoundError('DeliveryRule');
      }

      const before = await Repository.DeliveryRules().findOneRaw(new Types.ObjectId(idParams.id));

      const effectiveMinAmount = params.minAmount !== undefined ? params.minAmount : rule.getMinAmount();
      if (
        params.maxAmount !== undefined &&
        params.maxAmount !== null &&
        effectiveMinAmount !== undefined &&
        params.maxAmount <= effectiveMinAmount
      ) {
        throw new BaseError(
          'maxAmount must be greater than minAmount',
          {
            en: 'maxAmount must be greater than minAmount',
            ru: 'maxAmount должен быть больше minAmount',
            uz: 'maxAmount minAmount dan katta bo\'lishi kerak',
          },
          400,
        );
      }

      if (params.minAmount !== undefined) {
        rule.buildMinAmount(params.minAmount);
      }
      if (params.maxAmount !== undefined) {
        rule.buildMaxAmount(params.maxAmount);
      }
      if (params.deliveryPrice !== undefined) {
        rule.buildDeliveryPrice(params.deliveryPrice);
      }
      if (params.note !== undefined) {
        rule.buildNote(params.note);
      }
      if (params.isActive !== undefined) {
        rule.buildIsActive(params.isActive);
      }
      // Admin cannot change priority - do not update it

      const updated = await Repository.DeliveryRules().update(rule);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'DeliveryRule',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true, id: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'DeliveryRule',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
