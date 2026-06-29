import * as Joi from 'joi';
import { PromoCodeTypeEnum, TranslatesSchema } from '@ubaytools/core';
import { description, swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddPromoCodeParams {
  @swaggerProperty({ type: 'string', required: false }) store: string;
  @swaggerProperty({ type: 'string' }) code: string;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string', example: PromoCodeTypeEnum.FIXED, description: Object.values(PromoCodeTypeEnum).join('|') }) type: PromoCodeTypeEnum;
  @swaggerProperty({ type: 'number' }) value: number;
  @swaggerProperty({ type: 'boolean' }) isActive: boolean;
  @swaggerProperty({ type: 'string' }) startDate: Date;
  @swaggerProperty({ type: 'string' }) endDate: Date;
  @swaggerProperty({ type: 'number', required: false, nullable: true }) usageLimit?: number | null;
  @swaggerProperty({ type: 'number', required: false, nullable: true }) perUserLimit?: number | null;

  constructor(params: any) {
    if (params) {
      this.store = params?.store;
      this.code = params?.code;
      this.description = params?.description;
      this.type = params?.type;
      this.value = params?.value;
      this.isActive = params?.isActive;
      this.startDate = params?.startDate;
      this.endDate = params?.endDate;
      this.usageLimit = params?.usageLimit ?? null;
      this.perUserLimit = params?.perUserLimit ?? null;
    }
  }

  async validate() {
    return await AddPromoCodeParamsSchema.validateAsync(this);
  }
}

export const AddPromoCodeParamsSchema = Joi.object<AddPromoCodeParams>({
  store: Joi.string().trim().allow(null),
  code: Joi.string().trim().uppercase().required(),
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  type: Joi.string()
    .valid(...Object.values(PromoCodeTypeEnum))
    .required(),
  value: Joi.number().greater(0).required(),
  isActive: Joi.boolean().default(true),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  usageLimit: Joi.number().integer().min(0).allow(null).optional(),
  perUserLimit: Joi.number().integer().min(0).allow(null).optional(),
});


