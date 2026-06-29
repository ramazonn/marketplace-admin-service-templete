import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddDeliveryRuleParams {
  @swaggerProperty({ type: 'number', required: true }) minAmount: number;
  @swaggerProperty({ type: 'number' }) maxAmount: number | null;
  @swaggerProperty({ type: 'number', required: true }) deliveryPrice: number;
  @swaggerProperty({ type: 'string' }) note: string;

  constructor(params: any) {
    this.minAmount = params?.minAmount;
    this.maxAmount = params?.maxAmount ?? null;
    this.deliveryPrice = params?.deliveryPrice;
    this.note = params?.note;
  }

  async validate() {
    return await AddDeliveryRuleParamsSchema.validateAsync(this);
  }
}

export const AddDeliveryRuleParamsSchema = Joi.object<AddDeliveryRuleParams>({
  minAmount: Joi.number().min(0).required(),
  // maxAmount: Joi.number().min(0).allow(null).optional(),
  maxAmount: Joi.number()
  .min(0)
  .allow(null)
  .optional()
  .when(Joi.ref('minAmount'), {
    is: Joi.exist(),
    then: Joi.number().greater(Joi.ref('minAmount')).allow(null).messages({
      'number.greater': 'maxAmount must be greater than minAmount',
    }),
  }),
  deliveryPrice: Joi.number().min(0).required(),
  note: Joi.string().trim().allow('', null).optional(),
});
