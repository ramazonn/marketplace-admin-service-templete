import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/delivery-rules')
export default class DeleteDeliveryRuleController {
  @request('delete', '/{deliveryRuleId}')
  @summary('DeliveryRule delete')
  @security([])
  @tags(['DeliveryRules'])
  @path({ deliveryRuleId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.deliveryRuleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const rule = await Repository.DeliveryRules().getById(new Types.ObjectId(params.id));
      if (!rule) {
        throw new NotFoundError('DeliveryRule');
      }
      const before = await Repository.DeliveryRules().findOneRaw(new Types.ObjectId(params.id));
      await Repository.DeliveryRules().delete(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'DeliveryRule',
        resourceId: rule.getId(),
        before
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'DeliveryRule',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
