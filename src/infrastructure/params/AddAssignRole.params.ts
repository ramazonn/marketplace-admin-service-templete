import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { RoleAssignmentStatusEnum, RoleScopeEnum } from '@ubaytools/core';

const objectId = Joi.string().hex().length(24);

@swaggerClass()
export class AssignRoleParams {
  @swaggerProperty({ type: 'string', required: true, example: '65f0c2b...' })
  admin: string;

  @swaggerProperty({ type: 'string', required: true, example: '65f0c2b...' })
  role: string;

  @swaggerProperty({
    type: 'string',
    required: true,
    example: RoleScopeEnum.PLATFORM,
    description: Object.values(RoleScopeEnum).join('|'),
  })
  scope: RoleScopeEnum;

  @swaggerProperty({ type: 'string', required: false, example: '65f0c2b...' })
  store?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: RoleAssignmentStatusEnum.ACTIVE,
    description: Object.values(RoleAssignmentStatusEnum).join('|'),
  })
  status?: RoleAssignmentStatusEnum;

  constructor(params: any) {
    if (params) {
      this.admin = params?.admin;
      this.role = params?.role;
      this.scope = params?.scope;
      this.store = params?.store;
      this.status = params?.status;
    }
  }

  async validate() {
    return await AssignRoleParamsSchema.validateAsync(this);
  }
}

export const AssignRoleParamsSchema = Joi.object<AssignRoleParams>({
  admin: objectId.required(),
  role: objectId.required(),
  scope: Joi.string().valid(...Object.values(RoleScopeEnum)).required(),
  store: objectId.optional(),
  status: Joi.string()
    .valid(...Object.values(RoleAssignmentStatusEnum))
    .default(RoleAssignmentStatusEnum.ACTIVE),
}).custom((value, helpers) => {
  if (value.scope === RoleScopeEnum.STORE && !value.store) {
    return helpers.error('any.custom', { message: 'store is required when scope=STORE' });
  }
  return value;
});