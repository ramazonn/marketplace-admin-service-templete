import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { ActionLogService } from '../../services';

@prefix('/roles')
export default class DeleteRoleController {
    @request('delete', '/delete/{roleId}')
    @summary('Role delete')
    @security([])
    @tags(['Roles'])
    @path({ roleId: { type: 'string', required: true } })
    static async controller(context: Context): Promise<void> {
        let params: IdParams;

        try {
            params = await new IdParams({ id: context.params.roleId }).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const role = await Repository.Roles().getById(new Types.ObjectId(params.id));
            if (!role) {
                throw new NotFoundError('Role');
            }
            const before = await Repository.Roles().findOneRaw(new Types.ObjectId(params.id));;
            const deleted = await Repository.Roles().deleteById(new Types.ObjectId(params.id));

            await ActionLogService.logSuccess({
                context,
                action: ActionTypeEnum.DELETE,
                resource: 'Role',
                resourceId: role.getId(),
                before
            });

            return context.send.data({ deleted });
        } catch (error) {
            await ActionLogService.logFailure({
                context,
                action: ActionTypeEnum.DELETE,
                resource: 'role',
                resourceId: new Types.ObjectId(params.id),
                failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
            return context.send.error(error);
        }
    }
}