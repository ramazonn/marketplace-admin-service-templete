import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class BroadcastNotificationListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
    }
  }

  async validate() {
    return await BroadcastNotificationListParamsSchema.validateAsync(this);
  }
}

export const BroadcastNotificationListParamsSchema = Joi.object<BroadcastNotificationListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().optional(),
});

