import * as Joi from 'joi';
import { SellerStatusEnum, SellerTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class StoreListParams {
  @swaggerProperty({ type: 'number' }) page: number;
  @swaggerProperty({ type: 'number' }) size: number;
  @swaggerProperty({ type: 'string' }) sellerName: number;
  @swaggerProperty({ type: 'number' }) countOfProducts: number;
  @swaggerProperty({ type: 'number' }) rate: number;
  @swaggerProperty({ type: 'string' }) createdAt: Date;
  @swaggerProperty({ type: 'string' }) search: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.sellerName = params?.sellerName;
      this.countOfProducts = params?.countOfProducts;
      this.rate = params?.rate;
      this.createdAt = params?.createdAt;
      this.search = params?.search;
    }
  }

  async validate() {
    return await StoreListParamsSchema.validateAsync(this);
  }
}

export const StoreListParamsSchema = Joi.object<StoreListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  sellerName: Joi.string().optional(),
  countOfProducts: Joi.number().optional(),
  rate: Joi.number().optional(),
  createdAt: Joi.date().optional(),
  search: Joi.string().optional(),
});
