import { ProductStatusEnum } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class ProductListParams {
  @swaggerProperty({ type: 'array', items: { type: 'string' }, required: false, description: 'Product status (single value or array of values)' }) status: ProductStatusEnum | ProductStatusEnum[]
  @swaggerProperty({ type: 'string', required: false }) search: string;
  @swaggerProperty({ type: 'string', required: false }) store: string;
  @swaggerProperty({
    type: 'object',
    properties: {
      operator: { type: 'string', example: 'asc', description: 'asc|desc' },
      field: { type: 'string', example: 'order', description: 'order|count|price' },
    },
  })
  sort: any;
  @swaggerProperty({type: 'boolean', required: false}) syncwithSap: boolean;

  constructor(params: any) {
    if (params) {
      this.search = params?.search;
      this.store = params?.store;
      this.sort = params?.sort;
      this.status = params?.status
      this.syncwithSap = params?.syncwithSap;
    }
  }

  async validate() {
    return await ProductListParamsSchema.validateAsync(this);
  }
}

export const ProductListParamsSchema = Joi.object<ProductListParams>({
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(ProductStatusEnum)),
    Joi.array().items(Joi.string().valid(...Object.values(ProductStatusEnum)))
  ).optional(),
  search: Joi.string().optional(),
  store: Joi.string().optional(),
  sort: Joi.object({
    operator: Joi.string().valid('asc', 'desc').optional(),
    field: Joi.string().valid('order', 'count', 'price', 'avgStars').optional(),
  }).optional(),
  syncwithSap: Joi.boolean().optional()
});
