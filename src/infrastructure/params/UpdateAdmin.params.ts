import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { AdminStatusEnum, RoleScopeEnum } from '@ubaytools/core';

@swaggerClass()
export class UpdateAdminParams {
  @swaggerProperty({ type: 'string', required: false })
  firstName: string;

  @swaggerProperty({ type: 'string', required: false })
  lastName: string;

  @swaggerProperty({ type: 'string', required: false })
  username: string;

  @swaggerProperty({ type: 'string', required: false })
  password: string;

  @swaggerProperty({ type: 'string', required: false })
  phoneNumber: string;

  @swaggerProperty({ type: 'string', required: false, example: '65f0c2b...' })
  role?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: RoleScopeEnum.PLATFORM,
    description: Object.values(RoleScopeEnum).join('|'),
  })
  scope?: RoleScopeEnum;

  @swaggerProperty({ type: 'string', required: false, example: '65f0c2b...' })
  store?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: AdminStatusEnum.ACTIVE,
    description: Object.values(AdminStatusEnum).join('|'),
  })
  status: AdminStatusEnum;

  constructor(params: any) {
    if (params) {
      this.firstName = params?.firstName;
      this.lastName = params?.lastName;
      this.username = params?.username;
      this.password = params?.password;
      this.phoneNumber = params?.phoneNumber;
      this.role = params?.role;
      this.scope = params?.scope;
      this.store = params?.store;
      this.status = params?.status;
    }
  }

  async validate() {
    return await UpdateAdminParamsSchema.validateAsync(this);
  }
}

export const UpdateAdminParamsSchema = Joi.object<UpdateAdminParams>({
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  username: Joi.string().trim().optional(),
  password: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  role: Joi.string().trim().optional(),
  scope: Joi.string().valid(...Object.values(RoleScopeEnum)).optional(),
  store: Joi.string().trim().optional(),
  status: Joi.string().valid(...Object.values(AdminStatusEnum)).optional(),
});