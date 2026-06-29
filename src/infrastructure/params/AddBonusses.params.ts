import * as Joi from 'joi';
import { BonusTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddBonussesParams {
  @swaggerProperty({ 
    type: 'string', 
    example: BonusTypeEnum.WELCOME, 
    description: Object.values(BonusTypeEnum).join('|') 
  }) 
  type: BonusTypeEnum;

  @swaggerProperty({ type: 'string', required: true }) 
  store: string;

  @swaggerProperty({ type: 'number', required: true }) 
  amount: number;

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
    return await AddBonussesParamsSchema.validateAsync(this);
  }
}

export const AddBonussesParamsSchema = Joi.object<AddBonussesParams>({
  type: Joi.string()
    .valid(...Object.values(BonusTypeEnum))
    .required(),
  store: Joi.string().trim().required().pattern(new RegExp('^[0-9a-fA-F]{24}$')),
  amount: Joi.number().greater(0).required(),
  isActive: Joi.boolean().optional(),
});
