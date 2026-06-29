import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { ListParams } from './List.params';
import { SellerLeedStatusEnum } from '@ubaytools/core';

@swaggerClass()
export class SellerLeedListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number
  @swaggerProperty({ type: 'number', required: true }) size: number
  @swaggerProperty({ type: 'string', example: SellerLeedStatusEnum.NEW, description: Object.values(SellerLeedStatusEnum).join(' | ') }) status: SellerLeedStatusEnum

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.status = params.status
    }
  }

  async validate() {
    return await SellerLeedListParamsSchema.validateAsync(this);
  }
}

export const SellerLeedListParamsSchema = Joi.object<SellerLeedListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  status: Joi.string()
  .trim()
  .valid(...Object.values(SellerLeedStatusEnum))
  .optional(),
});
