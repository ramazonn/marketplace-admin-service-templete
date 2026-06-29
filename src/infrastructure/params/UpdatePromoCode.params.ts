import * as Joi from 'joi';
import { PromoCodeTypeEnum, TranslatesSchema } from '@ubaytools/core';
import { description, swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdatePromoCodeParams {
  @swaggerProperty({ type: 'string', required: false }) code?: string;
  @swaggerProperty({ type: 'object',properties: TranslateSwaggerSchema, required: false }) description?: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false, example: PromoCodeTypeEnum.FIXED, description: Object.values(PromoCodeTypeEnum).join('|') }) type?: PromoCodeTypeEnum;
  @swaggerProperty({ type: 'number', required: false }) value?: number;
  @swaggerProperty({ type: 'string', required: false }) startDate?: Date;
  @swaggerProperty({ type: 'string', required: false }) endDate?: Date;
  @swaggerProperty({ type: 'number', required: false, nullable: true }) usageLimit?: number | null;
  @swaggerProperty({ type: 'number', required: false, nullable: true }) perUserLimit?: number | null;

  constructor(params: any) {
    if (params) {
      this.code = params?.code;
      this.description = params?.description;
      this.type = params?.type;
      this.value = params?.value;
      this.startDate = params?.startDate;
      this.endDate = params?.endDate;
      this.usageLimit = params?.usageLimit ?? null;
      this.perUserLimit = params?.perUserLimit ?? null;
    }
  }

  async validate() {
    return await UpdatePromoCodeParamsSchema.validateAsync(this);
  }
}

export const UpdatePromoCodeParamsSchema = Joi.object<UpdatePromoCodeParams>({
  code: Joi.string().trim().uppercase().optional(),
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  type: Joi.string().valid(...Object.values(PromoCodeTypeEnum)).optional(),
  value: Joi.number().greater(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  usageLimit: Joi.number().integer().min(0).allow(null).optional(),
  perUserLimit: Joi.number().integer().min(0).allow(null).optional(),
});


