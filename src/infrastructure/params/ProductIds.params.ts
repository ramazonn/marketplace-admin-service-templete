import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class ProductIdsParams {
  @swaggerProperty({ type: 'array', items: { type: 'string' }, required: true }) products: Array<string>;

  constructor(params: any) {
    this.products = params?.products;
  }

  async validate() {
    return await AddProductToCarouselParamsSchema.validateAsync(this);
  }
}

export const AddProductToCarouselParamsSchema = Joi.object<ProductIdsParams>({
  products: Joi.array().items(Joi.string().required()).required(),
});
