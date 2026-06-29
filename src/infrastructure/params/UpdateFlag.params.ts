import * as Joi from 'joi';
import { CategoryStatusEnum, FaqStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateFlagParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema, required: false }) name: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false }) color: string;

  constructor(params: any) {
    this.name = params?.name;
    this.color = params?.color;
  }

  async validate() {
    return await UpdateFlagParamsSchema.validateAsync(this);
  }
}

export const UpdateFlagParamsSchema = Joi.object<UpdateFlagParams>({
  name: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  color: Joi.string().trim().optional(),
});
