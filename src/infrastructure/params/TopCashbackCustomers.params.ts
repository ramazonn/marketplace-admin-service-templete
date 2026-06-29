import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class GetTopCashbackCustomersParams {
  @swaggerProperty({ type: 'string', required: false })
  store?: string;

  constructor(params: any) {
    if (params) {
      this.store = params.store;
    }
  }

  async validate() {
    return await GetTopCashbackCustomersParamsSchema.validateAsync(this);
  }
}

export const GetTopCashbackCustomersParamsSchema = Joi.object<GetTopCashbackCustomersParams>({
  store: Joi.string().optional()
});