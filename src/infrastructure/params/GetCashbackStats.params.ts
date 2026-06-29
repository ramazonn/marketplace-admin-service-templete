import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class GetCashbackStatsParams {

  @swaggerProperty({ type: 'string', required: false })
  store?: string;

  constructor(params: any) {
    if (params) {
      this.store = params.store;
    }
  }

  async validate() {
    return await GetCashbackStatsParamsSchema.validateAsync(this);
  }
}

export const GetCashbackStatsParamsSchema = Joi.object<GetCashbackStatsParams>({
  store: Joi.string().optional()
});