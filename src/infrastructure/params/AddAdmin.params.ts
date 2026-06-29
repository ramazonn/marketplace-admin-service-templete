import * as Joi from 'joi';
import { PromotionPageEnum, RoleScopeEnum, RolesEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddAdminParams {
  @swaggerProperty({ type: 'string', required: true }) username: string;
  @swaggerProperty({ type: 'string', required: true })
  password: PromotionPageEnum;
  @swaggerProperty({ type: 'string', required: true }) firstName: string;
  @swaggerProperty({ type: 'string', required: true }) lastName: string;
  @swaggerProperty({ type: 'string', required: false }) phoneNumber: string;
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

  constructor(params: any) {
    this.firstName = params?.firstName;
    this.lastName = params?.lastName;
    this.username = params?.username;
    this.password = params?.password;
    this.phoneNumber = params?.phoneNumber;
    this.role = params?.role;
    this.scope = params?.scope;
    this.store = params?.store
  }

  async validate() {
    return await AddAdminParamsSchema.validateAsync(this);
  }
}

export const AddAdminParamsSchema = Joi.object<AddAdminParams>({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().optional(),
  role: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  store: Joi.string().optional(),
  scope: Joi.string().valid(...Object.values(RoleScopeEnum)).required()
});
