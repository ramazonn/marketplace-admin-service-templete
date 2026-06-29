import * as Joi from 'joi';
import { CategoryStatusEnum, FaqStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddFlagParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema, required: true }) name: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: true }) color: string;

  constructor(params: any) {
    this.name = params?.name;
    this.color = params?.color;
  }

  async validate() {
    return await AddFlagParamsSchema.validateAsync(this);
  }
}

export const AddFlagParamsSchema = Joi.object<AddFlagParams>({
  name: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  color: Joi.string().trim().required(),
});
