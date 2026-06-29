import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { ActionLogStatusEnum, ActionTypeEnum } from '@ubaytools/core';

@swaggerClass()
export class ActionLogListParams {
  @swaggerProperty({
    type: 'string',
    required: false,
  })
  admin?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: 'John Doe',
  })
  actorName?: string;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: ActionTypeEnum.UPDATE,
  })
  action?: ActionTypeEnum;

  @swaggerProperty({
    type: 'string',
    required: false,
    example: ActionLogStatusEnum.SUCCESS,
  })
  status?: ActionLogStatusEnum;

  constructor(params: any) {
    this.admin = params?.admin;
    this.actorName = params?.actorName;
    this.action = params?.action;
    this.status = params?.status;
  }

  async validate() {
    return await ActionLogListParamsSchema.validateAsync(this);
  }
}

export const ActionLogListParamsSchema = Joi.object<ActionLogListParams>({
  admin: Joi.string().optional(),
  actorName: Joi.string().trim().optional(),
  action: Joi.string()
    .valid(...Object.values(ActionTypeEnum))
    .optional(),
  status: Joi.string()
    .valid(...Object.values(ActionLogStatusEnum))
    .optional(),
});
