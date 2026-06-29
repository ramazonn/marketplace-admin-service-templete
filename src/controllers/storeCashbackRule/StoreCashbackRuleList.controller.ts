import { Context } from 'koa';
import { StoreCashbackRuleListParams } from '../../infrastructure';
import { Repository, StoreCashbackRulesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class StoreCashbackRuleListItemResponse {
  id: string;
  storeId: string;
  amount: number;
  lowerPercent: number;
  upperPercent: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(rule: StoreCashbackRulesEntity) {
    this.id = rule.getId().toString();
    this.storeId = rule.getStoreId().toString();
    this.amount = rule.getAmount();
    this.lowerPercent = rule.getLowerPercent();
    this.upperPercent = rule.getUpperPercent();
    this.createdAt = rule.getCreatedAt();
    this.updatedAt = rule.getUpdatedAt();
  }
}

@prefix('/store-cashback-rule')
export default class StoreCashbackRuleListController {
  @request('get', '/list')
  @summary('StoreCashbackRule list')
  @security([])
  @tags(['StoreCashbackRule'])
  @query((StoreCashbackRuleListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: StoreCashbackRuleListParams;
    try {
      params = await new StoreCashbackRuleListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {
        storeId: new Types.ObjectId(params.storeId)
      };

      const count = await Repository.StoreCashbackRules().countDocumentsByFilter(filter);
      const rules = await Repository.StoreCashbackRules().list(
        { page: params.page, size: params.size },
        filter,
        { amount: 1 }
      );

      const response = rules.map((rule) => new StoreCashbackRuleListItemResponse(rule));
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}

