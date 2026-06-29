import * as Joi from 'joi';
import { CategoryStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddCategoryParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema, required: true }) name: TranslatesSchema;
  @swaggerProperty({ type: 'string' }) description: string;
  @swaggerProperty({ type: 'number' }) percent: number;
  @swaggerProperty({ type: 'string', example: CategoryStatusEnum.ACTIVE, description: Object.values(CategoryStatusEnum).join('|') })
  status: CategoryStatusEnum;
  @swaggerProperty({ type: 'string' }) icon: string;
  @swaggerProperty({ type: 'string' }) parent: string;
  @swaggerProperty({ type: 'boolean' }) isPopular: boolean;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema, required: true }) how_to_select_text: TranslatesSchema;
  @swaggerProperty({ type: 'string' }) how_to_select_url: string;

  constructor(params: any) {
    this.name = params?.name;
    this.description = params?.description;
    this.percent = params?.percent;
    this.status = params?.status;
    this.icon = params?.icon;
    this.parent = params?.parent;
    this.isPopular = params?.isPopular;
    this.how_to_select_text = params?.how_to_select_text;
    this.how_to_select_url = params?.how_to_select_url;
  }

  async validate() {
    return await AddCategoryParamsSchema.validateAsync(this);
  }
}

export const AddCategoryParamsSchema = Joi.object<AddCategoryParams>({
  description: Joi.string().trim().optional(),
  name: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  percent: Joi.number().required(),
  status: Joi.object().allow(...Object.values(CategoryStatusEnum)),
  icon: Joi.string().trim().optional(),
  isPopular: Joi.boolean().optional(),
  parent: Joi.string().trim().allow(null).optional(),
  how_to_select_text: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  how_to_select_url: Joi.string().trim().optional(),
});
