import * as Joi from 'joi';
import { PromoCodeTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class PromoListParams {
  @swaggerProperty({ type: 'string', required: false }) store: string;
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'boolean', required: false }) isActive?: boolean;
  @swaggerProperty({ type: 'string', required: false, example: PromoCodeTypeEnum.FIXED, description: Object.values(PromoCodeTypeEnum).join('|') }) type?: PromoCodeTypeEnum;

  constructor(params: any) {
    if (params) {
      this.store = params?.store;
      this.page = params?.page;
      this.size = params?.size;
      this.isActive = params?.isActive;
      this.type = params?.type;
    }
  }

  async validate() {
    return await PromoListParamsSchema.validateAsync(this);
  }
}

export const PromoListParamsSchema = Joi.object<PromoListParams>({
  store: Joi.string().optional(),
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  isActive: Joi.boolean().optional(),
  type: Joi.string().valid(...Object.values(PromoCodeTypeEnum)).optional(),
});


