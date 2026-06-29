import * as Joi from 'joi';
import { BonusTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class BonussesListParams {
  @swaggerProperty({ type: 'number', required: true }) 
  page: number;

  @swaggerProperty({ type: 'number', required: true }) 
  size: number;

  @swaggerProperty({ 
    type: 'string', 
    required: false,
    example: BonusTypeEnum.WELCOME, 
    description: Object.values(BonusTypeEnum).join('|') 
  }) 
  type?: BonusTypeEnum;

  @swaggerProperty({ type: 'string', required: false }) 
  store?: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.type = params?.type;
      this.store = params?.store;
    }
  }

  async validate() {
    return await BonussesListParamsSchema.validateAsync(this);
  }
}

export const BonussesListParamsSchema = Joi.object<BonussesListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  type: Joi.string()
    .valid(...Object.values(BonusTypeEnum))
    .optional(),
  store: Joi.string().trim().pattern(new RegExp('^[0-9a-fA-F]{24}$')).optional(),
});
