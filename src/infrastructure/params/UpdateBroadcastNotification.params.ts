import * as Joi from 'joi';
import { BroadcastNotificationStatusEnum, BroadcastNotificationTargetSchema, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateBroadcastNotificationParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) title: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) text: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false }) imageUrl: string;
  @swaggerProperty({ type: 'string', example: BroadcastNotificationStatusEnum.SCHEDULED, description: Object.values(BroadcastNotificationStatusEnum).join('|') }) status: BroadcastNotificationStatusEnum;
  @swaggerProperty({ type: 'object', required: false }) target: BroadcastNotificationTargetSchema;
  @swaggerProperty({ type: 'object', required: false, description: 'type: { [key: string]: any }' }) metadata: Record<string, any>;

  constructor(params: any) {
    this.title = params?.title;
    this.text = params?.text;
    this.imageUrl = params?.imageUrl;
    this.status = params?.status;
    this.target = params?.target;
    this.metadata = params?.metadata;
  }

  async validate() {
    return await UpdateBroadcastNotificationParamsSchema.validateAsync(this);
  }
}

export const UpdateBroadcastNotificationParamsSchema = Joi.object<UpdateBroadcastNotificationParams>({
  title: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  text: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  imageUrl: Joi.string().allow(null, '').optional(),
  status: Joi.string()
    .trim()
    .valid(...Object.values(BroadcastNotificationStatusEnum))
    .optional(),
  target: Joi.object().optional(),
  metadata: Joi.object().optional(),
});

