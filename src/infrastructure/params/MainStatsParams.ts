import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class MainStatsParams {
  @swaggerProperty({ type: 'string', required: false, example: new Date() }) fromDate: Date;
  @swaggerProperty({ type: 'string', required: false, example: new Date() }) toDate: Date;
  @swaggerProperty({ type: 'string', required: false })
  storeId?: string; 

  constructor(params: any) {
    if (params) {
      this.fromDate = params?.fromDate;
      this.toDate = params?.toDate;
      this.storeId = params?.storeId;
    }
  }

  async validate() {
    return await MainStatsParamsSchema.validateAsync(this);
  }
}

export const MainStatsParamsSchema = Joi.object<MainStatsParams>({
  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional(),
   storeId: Joi.string().optional()
});
