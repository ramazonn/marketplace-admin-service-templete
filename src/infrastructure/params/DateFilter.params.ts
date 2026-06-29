import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class DateFilterParams {
  @swaggerProperty({ type: 'string', required: false, example: new Date() }) startDate: Date;
  @swaggerProperty({ type: 'string', required: false, example: new Date() }) endDate: Date;

  constructor(params: any) {
    if (params) {
      this.startDate = params?.startDate;
      this.endDate = params?.endDate;
    }
  }

  async validate() {
    return await DateFilterParamsSchema.validateAsync(this);
  }
}

export const DateFilterParamsSchema = Joi.object<DateFilterParams>({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});
