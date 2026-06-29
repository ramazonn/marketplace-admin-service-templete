import * as Joi from 'joi';
import { SellerStatusEnum, SellerTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class SellerListParams {
  @swaggerProperty({ type: 'number', required: true, example: 1 }) page: number;
  @swaggerProperty({ type: 'number', required: true, example: 10 }) size: number;
  @swaggerProperty({ type: 'string', required: false }) fullName: string;
  @swaggerProperty({ type: 'string', required: false }) phoneNumber: string;
  @swaggerProperty({ type: 'string', required: false, example: SellerStatusEnum.ACTIVE, description: Object.values(SellerStatusEnum).join(' | ') })
  status: SellerStatusEnum;
  @swaggerProperty({ type: 'number', required: false, example: 1 }) productCount: number;
  @swaggerProperty({ type: 'string', required: false }) search: number;
  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.phoneNumber = params?.phoneNumber;
      this.status = params?.status;
      this.fullName = params?.fullName;
      this.productCount = params?.productCount;
      this.search = params?.search;
    }
  }

  async validate() {
    return await SellerListParamsSchema.validateAsync(this);
  }
}

export const SellerListParamsSchema = Joi.object<SellerListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  fullName: Joi.string().trim().optional(),
  search: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  status: Joi.string()
    .trim()
    .allow(...Object.values(SellerStatusEnum))
    .optional(),
  productCount: Joi.number().min(0).optional(),
});
