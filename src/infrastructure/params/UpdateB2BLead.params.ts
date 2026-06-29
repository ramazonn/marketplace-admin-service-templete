import { B2BLeadStatusEnum } from '@ubaytools/core';
import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateB2BLeadParams {
  @swaggerProperty({ type: 'string', required: false }) comment: string;
  @swaggerProperty({ type: 'string', example: B2BLeadStatusEnum.NEW, description: Object.values(B2BLeadStatusEnum).join(' | ') }) status: B2BLeadStatusEnum;

  constructor(params: any) {
    this.comment = params?.comment;
    this.status = params?.status;
  }

  async validate() {
    return await UpdateB2BLeadParamsSchema.validateAsync(this);
  }
}

export const UpdateB2BLeadParamsSchema = Joi.object<UpdateB2BLeadParams>({  
  comment: Joi.string().trim().optional().allow(''),
  status: Joi.string()
  .trim()
  .valid(...Object.values(B2BLeadStatusEnum))
  .optional(),
});
