import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class GetTopProductsParams {

  @swaggerProperty({ type: 'string', required: false })
  store?: string;

  constructor(params: any) {
    if (params) {
      this.store = params.store;
    }
  }

  async validate() {
    return await TopProductsParamsSchema.validateAsync(this);
  }
}

export const TopProductsParamsSchema = Joi.object<GetTopProductsParams>({
  store: Joi.string().optional()
});