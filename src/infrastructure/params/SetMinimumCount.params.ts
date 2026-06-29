import { SetMinimumCountEnum } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class SetMinimumCountParams {
  @swaggerProperty({ 
    type: 'string', 
    example: SetMinimumCountEnum.ALL, description: Object.values(SetMinimumCountEnum).join('|') }) 
  type: SetMinimumCountEnum;

  @swaggerProperty({ 
    type: 'number', 
    minimum: 0,
    description: 'Minimum count value to set for products'
  }) 
  minimumCount: number;

  @swaggerProperty({ 
    type: 'array', 
    items: { type: 'string' },
    description: 'Array of product IDs (required when type is custom)'
  }) 
  productIds?: Array<string>;

  constructor(params: any) {
    this.type = params?.type;
    this.minimumCount = params?.minimumCount;
    this.productIds = params?.productIds;
  }

  async validate() {
    return await SetMinimumCountParamsSchema.validateAsync(this);
  }
}

export const SetMinimumCountParamsSchema = Joi.object<SetMinimumCountParams>({
  type:  Joi.object().allow(...Object.values(SetMinimumCountEnum)).required(),
  minimumCount: Joi.number().min(0).required(),
  productIds: Joi.when('type', {
    is: SetMinimumCountEnum.CUSTOM,
    then: Joi.array().items(Joi.string().required()).min(1).required(),
    otherwise: Joi.forbidden()
  })
}); 