import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateDeliveryRuleParams {
  @swaggerProperty({ type: 'number' }) minAmount: number;
  @swaggerProperty({ type: 'number' }) maxAmount: number | null;
  @swaggerProperty({ type: 'number' }) deliveryPrice: number;
  @swaggerProperty({ type: 'string' }) note: string;
  @swaggerProperty({ type: 'boolean' }) isActive: boolean;

  constructor(params: any) {
    this.minAmount = params?.minAmount;
    this.maxAmount = params?.maxAmount;
    this.deliveryPrice = params?.deliveryPrice;
    this.note = params?.note;
    this.isActive = params?.isActive;
  }

  async validate() {
    return await UpdateDeliveryRuleParamsSchema.validateAsync(this);
  }
}

export const UpdateDeliveryRuleParamsSchema = Joi.object<UpdateDeliveryRuleParams>({
  minAmount: Joi.number().min(0).optional(),
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
  deliveryPrice: Joi.number().min(0).optional(),
  note: Joi.string().trim().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});
