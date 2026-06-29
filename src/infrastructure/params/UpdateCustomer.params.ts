import * as Joi from 'joi';
import { UserStatusEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateCustomerParams {
  @swaggerProperty({ type: 'string' }) phoneNumber: string;
  @swaggerProperty({ type: 'number', example: UserStatusEnum.ACTIVE, description: Object.values(UserStatusEnum).join('|') }) status: UserStatusEnum;
  // TODO other params

  constructor(params: any) {
    this.phoneNumber = params?.phoneNumber;
    this.status = params?.status;
  }

  async validate() {
    return await UpdateCustomerParamsSchema.validateAsync(this);
  }
}

export const UpdateCustomerParamsSchema = Joi.object<UpdateCustomerParams>({
  phoneNumber: Joi.string().trim().optional(),
  status: Joi.number().allow(...Object.values(UserStatusEnum)),
});
