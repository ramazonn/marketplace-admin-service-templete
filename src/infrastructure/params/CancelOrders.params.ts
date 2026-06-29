import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class CancelOrdersParams {
  @swaggerProperty({ type: 'array', items: { type: 'string' }, required: true }) orderIds: Array<string>;

  constructor(params: any) {
    this.orderIds = params?.orderIds;
  }

  async validate() {
    return await CancelOrdersParamsSchema.validateAsync(this);
  }
}

export const CancelOrdersParamsSchema = Joi.object<CancelOrdersParams>({
  orderIds: Joi.array().items(Joi.string().required()).required(),
});
