import { SellerLeedStatusEnum } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateSellerLeedParams {
  @swaggerProperty({ type: 'string', required: false }) comment: string;
  @swaggerProperty({ type: 'string', example: SellerLeedStatusEnum.NEW, description: Object.values(SellerLeedStatusEnum).join(' | ') }) status: SellerLeedStatusEnum;

  constructor(params: any) {
    this.comment = params?.comment;
    this.status = params?.status;
  }

  async validate() {
    return await UpdateSellerLeedParamsSchema.validateAsync(this);
  }
}

export const UpdateSellerLeedParamsSchema = Joi.object<UpdateSellerLeedParams>({  
  comment: Joi.string().trim().optional().allow(''),
  status: Joi.string()
  .trim()
  .valid(...Object.values(SellerLeedStatusEnum))
  .optional(),
});
