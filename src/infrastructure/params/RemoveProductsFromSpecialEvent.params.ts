import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class RemoveProductsFromSpecialEventParams {
  @swaggerProperty({ type: 'array', items: { type: 'string' }, required: true }) products: Array<string>;

  constructor(params: any) {  
    this.products = params?.products;
  }

  async validate() {
    return await RemoveProductsFromSpecialEventParamsSchema.validateAsync(this);
  }
}

export const RemoveProductsFromSpecialEventParamsSchema = Joi.object<RemoveProductsFromSpecialEventParams>({
  products: Joi.array().items(Joi.string().required()).required(),
});   