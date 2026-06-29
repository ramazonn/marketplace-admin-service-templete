import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, DeliveryRulesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

class DeliveryRuleDetailResponse {
  id: string;
  priority: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  deliveryPrice: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(rule: DeliveryRulesEntity) {
    this.id = rule.getId().toString();
    this.priority = rule.getPriority();
    this.isActive = rule.getIsActive();
    this.minAmount = rule.getMinAmount();
    this.maxAmount = rule.getMaxAmount() ?? null;
    this.deliveryPrice = rule.getDeliveryPrice();
    this.note = rule.getNote() ?? null;
    this.createdAt = rule.getCreatedAt();
    this.updatedAt = rule.getUpdatedAt();
  }
}

@prefix('/delivery-rules')
export default class DeliveryRuleDetailController {
  @request('get', '/detail/{deliveryRuleId}')
  @summary('DeliveryRule detail')
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
      const response = new DeliveryRuleDetailResponse(rule);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
