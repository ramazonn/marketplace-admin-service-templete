import * as Joi from 'joi';
import { CategoryStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class PrintBarcodeParams {
  @swaggerProperty({ type: 'array', items: { type: 'string', description: 'product id' } }) products: Array<string>;
  constructor(params) {
    this.products = params?.products;
  }

  async validate() {
    return await PrintBarcodeParamsSchema.validateAsync(this);
  }
}

export const PrintBarcodeParamsSchema = Joi.object<PrintBarcodeParams>({
  products: Joi.array().items(Joi.string()).optional(),
});
