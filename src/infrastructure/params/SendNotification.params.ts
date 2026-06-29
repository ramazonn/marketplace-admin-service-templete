import * as Joi from 'joi';
import { NewsStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class SendNotificationParams {
  @swaggerProperty({ type: 'string', required: true }) client: string;
  @swaggerProperty({ type: 'string', required: true }) title: string;
  @swaggerProperty({ type: 'string', required: true }) description: string;
  @swaggerProperty({ type: 'object', required: false, description: 'type: { [key: string]: string }' }) data: { [key: string]: string };

  constructor(params: any) {
    this.title = params?.title;
    this.description = params?.description;
    this.data = params?.data;
    this.client = params?.client;
  }

  async validate() {
    return await SendNotificationParamsSchema.validateAsync(this);
  }
}

export const SendNotificationParamsSchema = Joi.object<SendNotificationParams>({
  client: Joi.string().trim().required(),
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  data: Joi.object().optional(),
});
