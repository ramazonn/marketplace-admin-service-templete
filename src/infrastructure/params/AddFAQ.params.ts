import * as Joi from 'joi';
import { CategoryStatusEnum, FaqStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';
import { FaqTypeEnum } from '@ubaytools/core';

@swaggerClass()
export class AddFAQParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) title: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) attachments: Array<string>;
  @swaggerProperty({ type: 'string', example: FaqStatusEnum.ACTIVE, description: Object.values(FaqStatusEnum).join('|') }) status: FaqStatusEnum;
  @swaggerProperty({ type: 'string', example: FaqTypeEnum.DEFAULT, description: Object.values(FaqTypeEnum).join('|') }) type: FaqTypeEnum;

  constructor(params: any) {
    this.title = params?.title;
    this.description = params?.description;
    this.attachments = params?.attachments;
    this.status = params?.status;
    this.type = params?.type;
  }

  async validate() {
    return await AddFAQParamsSchema.validateAsync(this);
  }
}

export const AddFAQParamsSchema = Joi.object<AddFAQParams>({
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  title: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  attachments: Joi.array().optional(),
  status: Joi.string()
    .trim()
    .optional()
    .allow(...Object.values(FaqStatusEnum)),
  type: Joi.string()
    .trim()
    .optional()
    .allow(...Object.values(FaqTypeEnum)),
});
