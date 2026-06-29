import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { RoleScopeEnum } from '@ubaytools/core';

@swaggerClass()
export class RoleListParams {
    @swaggerProperty({ type: 'string', required: false, example: RoleScopeEnum.PLATFORM })
    scope?: RoleScopeEnum;

    @swaggerProperty({ type: 'string', required: false, example: 'operator' })
    search?: string;

    constructor(data: any) {
        this.scope = data?.scope;
        this.search = data?.search;
    }

    async validate(): Promise<RoleListParams> {
        const schema = Joi.object({
            scope: Joi.string().optional(),
            search: Joi.string().trim().allow('').optional(),
        });

        const value = await schema.validateAsync(this, { abortEarly: false, stripUnknown: true });
        return new RoleListParams(value);
    }
}