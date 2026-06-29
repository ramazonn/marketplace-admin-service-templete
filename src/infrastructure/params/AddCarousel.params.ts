import * as Joi from 'joi';
import { CarouselStatusEnum, CategoryStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddCarouselParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) title: TranslatesSchema;
  @swaggerProperty({ type: 'string', example: CarouselStatusEnum.ACTIVE, description: Object.values(CarouselStatusEnum).join('|') })
  status: CarouselStatusEnum;

  constructor(params: any) {
    this.title = params?.title;
    this.status = params?.status;
  }

  async validate() {
    return await AddCarouselParamsSchema.validateAsync(this);
  }
}

export const AddCarouselParamsSchema = Joi.object<AddCarouselParams>({
  title: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  status: Joi.object().allow(...Object.values(CategoryStatusEnum)),
});
