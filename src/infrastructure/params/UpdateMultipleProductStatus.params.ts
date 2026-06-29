import * as Joi from 'joi';
import { ProductStatusEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateMultipleProductStatusParams {
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) productIds: Array<string>;
  @swaggerProperty({ type: 'string', example: ProductStatusEnum.IN_STOCK, description: Object.values(ProductStatusEnum).join(' | ') }) status: ProductStatusEnum;



  constructor(params: any) {
    this.productIds = params?.productIds;    
    this.status = params?.status;
  }

  async validate() {
    return await UpdateMultipleProductStatusParamsSchema.validateAsync(this);
  }
}

export const UpdateMultipleProductStatusParamsSchema = Joi.object<UpdateMultipleProductStatusParams>({
    productIds: Joi.array().items(Joi.string()).required(),
  status: Joi.string()
    .trim()
    .valid(...Object.values(ProductStatusEnum))
    .required(),
});
