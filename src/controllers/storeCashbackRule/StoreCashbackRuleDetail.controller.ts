import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, StoreCashbackRulesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

class StoreCashbackRuleDetailResponse {
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
export default class StoreCashbackRuleDetailController {
  @request('get', '/detail/{storeCashbackRuleId}')
  @summary('StoreCashbackRule detail')
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
      const response = new StoreCashbackRuleDetailResponse(rule);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}

