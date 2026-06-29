import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { B2BLeadStatusEnum } from '@ubaytools/core';

@swaggerClass()
export class B2BLeadListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number
  @swaggerProperty({ type: 'number', required: true }) size: number
  @swaggerProperty({ type: 'string', example: B2BLeadStatusEnum.NEW, description: Object.values(B2BLeadStatusEnum).join(' | ') }) status: B2BLeadStatusEnum

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.status = params.status
    }
  }

  async validate() {
    return await B2BLeadListParamsSchema.validateAsync(this);
  }
}

export const B2BLeadListParamsSchema = Joi.object<B2BLeadListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  status: Joi.string()
  .trim()
  .valid(...Object.values(B2BLeadStatusEnum))
  .optional(),
});
