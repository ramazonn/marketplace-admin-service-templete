import * as Joi from 'joi';
import { NewsStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddNewsParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) title: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema })
  attachment: TranslatesSchema;
  @swaggerProperty({ type: 'string' }) startDate: Date;
  @swaggerProperty({ type: 'string' }) endDate: Date;
  @swaggerProperty({ type: 'string' }) link: string;
  @swaggerProperty({ type: 'string', example: NewsStatusEnum.ACTIVE, description: Object.values(NewsStatusEnum).join('|') }) status: NewsStatusEnum;

  constructor(params: any) {
    this.title = params?.title;
    this.description = params?.description;
    this.attachment = params?.attachment;
    this.startDate = params?.startDate;
    this.endDate = params?.endDate;
    this.link = params?.link;
    this.status = params?.status;
  }

  async validate() {
    return await AddNewsParamsSchema.validateAsync(this);
  }
}

export const AddNewsParamsSchema = Joi.object<AddNewsParams>({
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  title: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  attachment: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  link: Joi.string(),
  status: Joi.object().allow(...Object.values(NewsStatusEnum)),
});
