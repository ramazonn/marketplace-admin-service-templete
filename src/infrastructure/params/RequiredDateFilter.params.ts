import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class RequiredDateFilterParams {
  @swaggerProperty({ type: 'string', required: true, example: new Date() }) startDate: Date;
  @swaggerProperty({ type: 'string', required: true, example: new Date() }) endDate: Date;

  constructor(params: any) {
    if (params) {
      this.startDate = params?.startDate;
      this.endDate = params?.endDate;
    }
  }

  async validate() {
    return await RequiredDateFilterParamsSchema.validateAsync(this);
  }
}

export const RequiredDateFilterParamsSchema = Joi.object<RequiredDateFilterParams>({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});
