import * as Joi from 'joi';
import { CategoryStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddBrandParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) name: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string' }) avatar: string;

  constructor(params: any) {
    this.name = params?.name;
    this.description = params?.description;
    this.avatar = params?.avatar;
  }

  async validate() {
    return await AddBrandParamsSchema.validateAsync(this);
  }
}

export const AddBrandParamsSchema = Joi.object<AddBrandParams>({
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  name: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  avatar: Joi.string().trim().optional(),
});
