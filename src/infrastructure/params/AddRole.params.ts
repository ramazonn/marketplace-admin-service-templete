import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { RoleScopeEnum, RolesEnum } from '@ubaytools/core';

@swaggerClass()
export class AddRoleParams {
  @swaggerProperty({
    type: 'string',
    required: true,
    example: RoleScopeEnum.PLATFORM,
    description: Object.values(RoleScopeEnum).join('|')
  })
  scope: RoleScopeEnum;

  @swaggerProperty({
    type: 'string',
    required: true,
    example: RolesEnum.OPERATOR,
    description: Object.values(RolesEnum).join('|')
  })
  code: string;

  @swaggerProperty({ type: 'string', required: true, example: 'Content manager' })
  name: string;

  @swaggerProperty({ type: 'array', items: { type: 'number' }, required: true, example: [201, 202] })
  permissions: number[];

  @swaggerProperty({ type: 'boolean', required: false, example: false })
  isSystem: boolean;

  constructor(params: any) {
    if (params) {
      this.scope = params?.scope;
      this.code = params?.code;
      this.name = params?.name;
      this.permissions = params?.permissions;
      this.isSystem = params?.isSystem;
    }
  }

  async validate() {
    return await CreateRoleParamsSchema.validateAsync(this);
  }
}

export const CreateRoleParamsSchema = Joi.object<AddRoleParams>({
  scope: Joi.string().trim().valid(...Object.values(RoleScopeEnum)).required(),
  code: Joi.string().trim().valid(...Object.values(RolesEnum)).required(),
  name: Joi.string().trim().required(),
  permissions: Joi.array().items(Joi.number()).default([]),
  isSystem: Joi.boolean().default(false),
});