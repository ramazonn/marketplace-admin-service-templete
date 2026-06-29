import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class SendNewsNotificationParams {
  @swaggerProperty({ type: 'string', required: true }) title: string;
  @swaggerProperty({ type: 'string', required: true }) body: string;
  @swaggerProperty({ type: 'object', required: false, description: 'Additional data payload' }) data: { [key: string]: string };
  @swaggerProperty({ type: 'string', required: false, description: 'URL of notification image' }) imageUrl: string;
  @swaggerProperty({ type: 'string', required: false, description: 'Custom click action' }) clickAction: string;

  constructor(params: any) {
    this.title = params?.title;
    this.body = params?.body;
    this.data = params?.data;
    this.imageUrl = params?.imageUrl;
    this.clickAction = params?.clickAction;
  }

  async validate() {
    return await SendNewsNotificationParamsSchema.validateAsync(this);
  }
}

export const SendNewsNotificationParamsSchema = Joi.object<SendNewsNotificationParams>({
  title: Joi.string().trim().required(),
  body: Joi.string().trim().required(),
  data: Joi.object().optional(),
  imageUrl: Joi.string().uri().optional(),
  clickAction: Joi.string().trim().optional(),
}); 