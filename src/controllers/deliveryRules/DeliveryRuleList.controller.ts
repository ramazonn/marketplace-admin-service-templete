import { Context } from 'koa';
import { DeliveryRuleListParams } from '../../infrastructure';
import { Repository, DeliveryRulesEntity } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class DeliveryRuleListItemResponse {
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
export default class DeliveryRuleListController {
  @request('get', '/list')
  @summary('DeliveryRule list')
  @security([])
  @tags(['DeliveryRules'])
  @query((DeliveryRuleListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: DeliveryRuleListParams;
    try {
      params = await new DeliveryRuleListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.DeliveryRules().countDocumentsByFilter({});
      const rules = await Repository.DeliveryRules().list(
        { page: params.page, size: params.size },
        {},
        { priority: 1 },
      );

      const response = rules.map((rule) => new DeliveryRuleListItemResponse(rule));
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
