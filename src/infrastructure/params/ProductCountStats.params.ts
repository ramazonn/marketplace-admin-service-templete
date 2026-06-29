import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class ProductCountByStatusParams {
  @swaggerProperty({ type: 'string', required: false })
  store?: string;

  constructor(params: any) {
    if (params) {
      this.store = params?.store;
    }
  }

  async validate() {
    return await ProductCountByStatusParamsSchema.validateAsync(this);
  }
}

export const ProductCountByStatusParamsSchema = Joi.object<ProductCountByStatusParams>({
  store: Joi.string().optional()
});