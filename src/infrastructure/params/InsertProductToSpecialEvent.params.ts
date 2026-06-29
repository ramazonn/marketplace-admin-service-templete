import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class InsertProductToSpecialEventParams {
  @swaggerProperty({
    type: 'array',
    required: true,
    items: {
      type: 'object',
      properties: {
        productId: { type: 'string', required: true },
        productLimit: { type: 'number', required: true },
        discountPercent: { type: 'number', required: true },
        discountPrice: { type: 'number', required: true },
        limitForSale: { type: 'number', required: true }
      }
    }
  })
  products: Array<{ productId: string; productLimit: number, discountPercent: number, discountPrice: number, limitForSale: number }>;

  constructor(params: any) {
    this.products = params?.products;
  }

  async validate() {
    return await InsertProductToSpecialEventParamsSchema.validateAsync(this);
  }
}

export const InsertProductToSpecialEventParamsSchema = Joi.object<InsertProductToSpecialEventParams>({
  products: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    productLimit: Joi.number().min(0).required(),
    discountPercent: Joi.number().min(0).max(50).required(), // Max discount is 50
    discountPrice: Joi.number().min(0).required(),
    limitForSale: Joi.number().min(0).required()
  })).required(),
});