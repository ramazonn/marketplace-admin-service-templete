import { TranslatesSchema } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateVideoContentParams {
  @swaggerProperty({ type: 'string', required: true }) videoLink: string;
  @swaggerProperty({ type: 'object', required:true, properties: TranslateSwaggerSchema }) title: TranslatesSchema;
  @swaggerProperty({ type: 'object', required:false, properties: TranslateSwaggerSchema }) description: TranslatesSchema;

  constructor(params: any) {
    this.videoLink = params?.videoLink;
    this.title = params?.title;
    this.description = params?.description;

  }

  async validate() {
    return await UpdateVideoContentParamsSchema.validateAsync(this);
  }
}

export const UpdateVideoContentParamsSchema = Joi.object<UpdateVideoContentParams>({  
  videoLink: Joi.string().uri().trim().optional(),
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
});
