import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateStoreCashbackRuleParams {
  @swaggerProperty({ type: 'string' }) storeId: string;
  @swaggerProperty({ type: 'number' }) amount: number;
  @swaggerProperty({ type: 'number' }) lowerPercent: number;
  @swaggerProperty({ type: 'number' }) upperPercent: number;

  constructor(params: any) {
    this.storeId = params?.storeId;
    this.amount = params?.amount;
    this.lowerPercent = params?.lowerPercent;
    this.upperPercent = params?.upperPercent;
  }

  async validate() {
    return await UpdateStoreCashbackRuleParamsSchema.validateAsync(this);
  }
}

export const UpdateStoreCashbackRuleParamsSchema = Joi.object<UpdateStoreCashbackRuleParams>({
  storeId: Joi.string().trim().optional().pattern(new RegExp('^[0-9a-fA-F]{24}$')),
  amount: Joi.number().min(0).optional(),
  lowerPercent: Joi.number().min(0).max(100).optional(),
  upperPercent: Joi.number().min(0).max(100).optional(),
});

