import { SpecialEventStatusEnum, TranslatesSchema } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddSpecialEventParams  {
  @swaggerProperty({ type: 'object', required: true ,properties: TranslateSwaggerSchema}) name: TranslatesSchema;
  @swaggerProperty({ type: 'object', required: false,properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false, example: SpecialEventStatusEnum.ACTIVE, description: Object.values(SpecialEventStatusEnum).join('|') }) status: SpecialEventStatusEnum;
  @swaggerProperty({ type: 'string', required: false }) backgroundImageMobile: string;
  @swaggerProperty({ type: 'string', required: false }) backgroundImageWeb: string;
  @swaggerProperty({ type: 'string', required: false }) startAt: Date;
  @swaggerProperty({ type: 'string', required: false }) endAt: Date;
  @swaggerProperty({ type: 'array', required: false, items: { type: 'number', minimum: 0, maximum: 6 }, example: [0,1,2,3,4,5] }) daysOfWeek: number[];
  @swaggerProperty({ type: 'number', required: false }) eventProductLimit: number;
  @swaggerProperty({ type: 'number', required: false }) eventLimitDuration: number;

  constructor(params: any) {
    this.name = params.name;
    this.description = params.description;
    this.status = params.status;
    this.backgroundImageMobile = params.backgroundImageMobile;
    this.backgroundImageWeb = params.backgroundImageWeb;
    this.startAt = params.startAt;
    this.endAt = params.endAt;
    this.daysOfWeek = params.daysOfWeek;
    this.eventProductLimit = params.eventProductLimit;
    this.eventLimitDuration = params.eventLimitDuration;
  }

  async validate() {
    return await AddSpecialEventParamsSchema.validateAsync(this);
  }

}

export const AddSpecialEventParamsSchema = Joi.object<AddSpecialEventParams>({
  name: Joi.object({
    uz: Joi.string().required(),
    ru: Joi.string().required(),
    en: Joi.string().required(),
  }).required(),
  description: Joi.object({
    uz: Joi.string().optional(),
    ru: Joi.string().optional(),
    en: Joi.string().optional(),
  }).optional(),
  status: Joi.object().allow(... Object.values(SpecialEventStatusEnum)).optional(),
  backgroundImageMobile: Joi.string().optional(),
  backgroundImageWeb: Joi.string().optional(),
  startAt: Joi.date().optional(),
  endAt: Joi.date().optional(),
  daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).optional(),
  eventProductLimit: Joi.number().min(0).optional(),
  eventLimitDuration: Joi.number().min(0).optional(),
});   