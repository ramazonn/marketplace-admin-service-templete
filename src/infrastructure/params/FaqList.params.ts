import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { FaqStatusEnum, FaqTypeEnum } from '@ubaytools/core';

@swaggerClass()
export class FaqListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search: string;
  @swaggerProperty({ type: 'string', required: false, example: FaqTypeEnum.DEFAULT, description: Object.values(FaqTypeEnum).join('|') }) type: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
      this.type = params?.type;
    }
  }

  async validate() {
    return await FaqListParamsSchema.validateAsync(this);
  }
}

export const FaqListParamsSchema = Joi.object<FaqListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().optional(),
  type: Joi.string().optional(),
});
