import * as Joi from 'joi';
import { BonusTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateBonussesParams {
  @swaggerProperty({ 
    type: 'string', 
    required: false,
    example: BonusTypeEnum.WELCOME, 
    description: Object.values(BonusTypeEnum).join('|') 
  }) 
  type?: BonusTypeEnum;

  @swaggerProperty({ type: 'string', required: false }) 
  store?: string;

  @swaggerProperty({ type: 'number', required: false }) 
  amount?: number;

  @swaggerProperty({ type: 'boolean', required: false }) 
  isActive?: boolean;

  constructor(params: any) {
    if (params) {
      this.type = params?.type;
      this.store = params?.store;
      this.amount = params?.amount;
      this.isActive = params?.isActive;
    }
  }

  async validate() {
    return await UpdateBonussesParamsSchema.validateAsync(this);
  }
}

export const UpdateBonussesParamsSchema = Joi.object<UpdateBonussesParams>({
  type: Joi.string()
    .valid(...Object.values(BonusTypeEnum))
    .optional(),
  store: Joi.string().trim().pattern(new RegExp('^[0-9a-fA-F]{24}$')).optional(),
  amount: Joi.number().greater(0).optional(),
  isActive: Joi.boolean().optional(),
});
