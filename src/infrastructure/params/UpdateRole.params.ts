import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { RoleScopeEnum, RolesEnum } from '@ubaytools/core';

@swaggerClass()
export class UpdateRoleParams {
  @swaggerProperty({
    type: 'string',
    required: false,
    example: RoleScopeEnum.PLATFORM,
  })
  scope?: RoleScopeEnum;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: RolesEnum.OPERATOR,
  })
  code?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: 'Store operator',
  })
  name?: string;

  @swaggerProperty({
    type: 'array',
    items: { type: 'number' },
    required: false,
    example: [201, 202, 203],
  })
  permissions?: number[];

  constructor(data: any) {
    this.scope = data.scope;
    this.code = data.code;
    this.name = data.name;
    this.permissions = data.permissions;
  }

  async validate(): Promise<UpdateRoleParams> {
    const schema = Joi.object({
      scope: Joi.string()
        .valid(...Object.values(RoleScopeEnum))
        .optional(),

      code: Joi.string()
        .trim()
        .valid(...Object.values(RolesEnum))
        .optional(),

      name: Joi.string()
        .trim()
        .min(2)
        .optional(),

      permissions: Joi.array()
        .items(Joi.number().integer())
        .min(0)
        .optional(),
    }).min(1);

    const value = await schema.validateAsync(this, {
      abortEarly: false,
      stripUnknown: true,
    });

    return new UpdateRoleParams(value);
  }
}