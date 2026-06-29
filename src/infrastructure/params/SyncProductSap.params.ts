import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class SyncProductSapParams {
  @swaggerProperty({
    type: 'array',
    required: false,
    items: { type: 'string' },
    description: 'Optional array of product IDs. If provided, sync runs only for these products'
  })
  products?: Array<string>;

  constructor(params: any) {
    this.products = params?.products;
  }

  async validate() {
    return await SyncProductSapParamsSchema.validateAsync(this);
  }
}

export const SyncProductSapParamsSchema = Joi.object<SyncProductSapParams>({
  products: Joi.array()
    .items(Joi.string().hex().length(24).required())
    .min(1)
    .optional(),
});