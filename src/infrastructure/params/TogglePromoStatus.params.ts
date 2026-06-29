import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class TogglePromoStatusParams {
  @swaggerProperty({ type: 'boolean' }) isActive: boolean;

  constructor(params: any) {
    if (params) {
      this.isActive = params?.isActive;
    }
  }

  async validate() {
    return await TogglePromoStatusParamsSchema.validateAsync(this);
  }
}

export const TogglePromoStatusParamsSchema = Joi.object<TogglePromoStatusParams>({
  isActive: Joi.boolean().required(),
});


