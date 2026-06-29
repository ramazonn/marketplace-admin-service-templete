import { Context } from 'koa';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

import { ActionLogFailureReasonEnum, ActionTypeEnum, BaseError, Repository, RolesEntity } from '@ubaytools/core';
import { AddRoleParams } from '../../infrastructure';
import { ActionLogService } from '../../services';

@prefix('/roles')
export default class AddRoleController {
    @request('post', '/add')
    @summary('Add role')
    @security([])
    @tags(['Roles'])
    @body((AddRoleParams as any).swaggerDocument)
    static async controller(context: Context): Promise<void> {
        let params: AddRoleParams;

        try {
            params = await new AddRoleParams(context.request.body).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const existed = await Repository.Roles().getByCode(params.code).catch(() => null);
            if (existed?.getId?.()) {
                throw new BaseError(
                    'Role code already exists',
                    {
                        en: 'Role code already exists',
                        ru: 'Код роли уже существует',
                        uz: 'Role code allaqachon mavjud',
                    },
                    409, // xohlasangiz 400 qiling
                );
            }


            const role = new RolesEntity()
                .buildScope(params.scope)
                .buildCode(params.code)
                .buildName(params.name);

            if (Array.isArray(params.permissions)) {
                role.buildPermissions(params.permissions);
            }

            const created = await Repository.Roles().create(role);

            await ActionLogService.logSuccess({
                context,
                action: ActionTypeEnum.CREATE,
                resource: 'role',
                resourceId: created.getId(),
                after: created.convertToSchema() as unknown as Record<string, unknown>
            });
            return context.send.data({ id: created.getId().toString() });
        } catch (error) {
            await ActionLogService.logFailure({
                context,
                action: ActionTypeEnum.CREATE,
                resource: 'Role',
                failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
            return context.send.error(error);
        }
    }
}