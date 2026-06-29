import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class ReOrderBannerPromotionParams {
  @swaggerProperty({ type: 'array',items:{type:"string"} }) ids: Array<string>;
  constructor(params: any) {
    this.ids = params?.ids;
  }

  async validate() {
    return await ReOrderBannerPromotionParamsSchema.validateAsync(this);
  }
}

export const ReOrderBannerPromotionParamsSchema = Joi.object<ReOrderBannerPromotionParams>({
  ids: Joi.array().items(Joi.string()).required()
});
