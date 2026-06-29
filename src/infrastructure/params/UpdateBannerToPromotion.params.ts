import * as Joi from 'joi';
import { CategoryStatusEnum, PromotionPageEnum, PromotionTypeEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { string } from 'joi';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateBannerToPromotionParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) attachment: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false, example: PromotionTypeEnum.FirstLine, description: Object.values(PromotionTypeEnum).join('|') })
  type: PromotionTypeEnum;
  @swaggerProperty({ type: 'string', required: false, example: PromotionPageEnum.Main, description: Object.values(PromotionPageEnum).join('|') })
  page: PromotionPageEnum;
  @swaggerProperty({ type: 'string', required: false }) startDate: Date;
  @swaggerProperty({ type: 'string', required: false }) endDate: Date;
  @swaggerProperty({ type: 'string', required: false }) link: string;
  @swaggerProperty({ type: 'string', required: false })
  screen?: string;
  @swaggerProperty({ type: 'string', required: false })
  screenId?: string;


  constructor(params: any) {
    this.attachment = params?.attachment;
    this.type = params?.type;
    this.startDate = params?.startDate;
    this.endDate = params?.endDate;
    this.link = params?.link;
    this.page = params?.page;
    this.screen = params?.screen;
    this.screenId = params?.screenId;
  }

  async validate() {
    return await UpdateBannerToPromotionParamsSchema.validateAsync(this);
  }
}

export const UpdateBannerToPromotionParamsSchema = Joi.object<UpdateBannerToPromotionParams>({
  attachment: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  link: Joi.string().optional(),
  type: Joi.object().allow(...Object.values(PromotionTypeEnum)),
  page: Joi.object().allow(...Object.values(PromotionPageEnum)),
  screen: Joi.string().optional().allow(null),
  screenId: Joi.string().optional().allow(null),
});
