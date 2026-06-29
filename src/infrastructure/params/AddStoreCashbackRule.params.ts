import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddStoreCashbackRuleParams {
  @swaggerProperty({ type: 'string', required: true }) storeId: string;
  @swaggerProperty({ type: 'number', required: true }) amount: number;
  @swaggerProperty({ type: 'number', required: true }) lowerPercent: number;
  @swaggerProperty({ type: 'number', required: true }) upperPercent: number;

  constructor(params: any) {
    this.storeId = params?.storeId;
    this.amount = params?.amount;
    this.lowerPercent = params?.lowerPercent;
    this.upperPercent = params?.upperPercent;
  }

  async validate() {
    return await AddStoreCashbackRuleParamsSchema.validateAsync(this);
  }
}

export const AddStoreCashbackRuleParamsSchema = Joi.object<AddStoreCashbackRuleParams>({
  storeId: Joi.string().trim().required().pattern(new RegExp('^[0-9a-fA-F]{24}$')),
  amount: Joi.number().min(0).required(),
  lowerPercent: Joi.number().min(0).max(100).required(),
  upperPercent: Joi.number().min(0).max(100).required()
    .greater(Joi.ref('lowerPercent'))
    .messages({
      'number.greater': 'upperPercent must be greater than lowerPercent'
    }),
});

