import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

export const ProductListFilterSwaggerSchema = {
  category: {
    type: 'string',
    required: false,
    description: 'Category id',
  },
  store: {
    type: 'string',
    required: false,
    description: 'Store id',
  },
};

export const ProductListSortSwaggerSchema = {
  createdAt: {
    type: 'number',
    enum: [1, -1],
    description: '1 = ASC, -1 = DESC',
  },
};

export class ProductListFilterSchema {
  category: string;
  store: string;
}
export class ProductListSortSchema {
  createdAt: number;
}
@swaggerClass()
export class OrderAbandonmentParams {
  @swaggerProperty({ type: 'string', required: false })
  search: string;

  @swaggerProperty({
    type: 'object',
    properties: ProductListFilterSwaggerSchema,
    required: false,
  })
  filter: ProductListFilterSchema;

  @swaggerProperty({
    type: 'object',
    properties: ProductListSortSwaggerSchema,
    required: false,
  })
  sort: ProductListSortSchema;

  constructor(params: any) {
    if (params) {
      this.search = params?.search;
      this.filter = params?.filter;
      this.sort = params?.sort;
    }
  }

  async validate() {
    return await OrderAbandonmentParamsSchema.validateAsync(this);
  }
}
export const OrderAbandonmentParamsSchema = Joi.object<OrderAbandonmentParams>({
  search: Joi.string().trim().optional(),
  filter: Joi.object({
    category: Joi.string().trim().optional(),
    store: Joi.string().trim().optional(),
  }).optional(),
  sort: Joi.object({
    createdAt: Joi.number().valid(1, -1).optional(),
  }).optional(),
});
