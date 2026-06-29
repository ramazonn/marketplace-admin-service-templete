import { SetMinimumCountEnum } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class SetGetCountFromEshopParams {
  @swaggerProperty({ 
    type: 'string', 
    example: SetMinimumCountEnum.ALL, description: Object.values(SetMinimumCountEnum).join('|') }) 
  type: SetMinimumCountEnum;

  @swaggerProperty({ 
    type: 'boolean', 
    description: 'get count from eshop value to set for products'
  }) 
  value: boolean;

  @swaggerProperty({ 
    type: 'array', 
    items: { type: 'string' },
    description: 'Array of product IDs (required when type is custom)'
  }) 
  productIds?: Array<string>;

  constructor(params: any) {
    this.type = params?.type;
    this.value = params?.value;
    this.productIds = params?.productIds;
  }

  async validate() {
    return await SetGetCountFromEshopParamsSchema.validateAsync(this);
  }
}

export const SetGetCountFromEshopParamsSchema = Joi.object<SetGetCountFromEshopParams>({
  type:  Joi.object().allow(...Object.values(SetMinimumCountEnum)).required(),
  value: Joi.boolean().required(),
  productIds: Joi.when('type', {
    is: SetMinimumCountEnum.CUSTOM,
    then: Joi.array().items(Joi.string().required()).min(1).required(),
    otherwise: Joi.forbidden()
  })
}); 