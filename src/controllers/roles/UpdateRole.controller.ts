import { Context } from 'koa';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

import { IdParams, UpdateRoleParams } from '../../infrastructure';
import { NotFoundError, Repository, Redis, ActionLogFailureReasonEnum, ActionTypeEnum } from '@ubaytools/core';
import { ActionLogService } from '../../services';

@prefix('/roles')
export default class UpdateRoleController {
  @request('put', '/update/{roleId}')
  @summary('Role update')
  @security([])
  @tags(['Roles'])
  @path({ roleId: { type: 'string', required: true } })
  @body((UpdateRoleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateRoleParams;
    let idParams: IdParams;

    try {
      params = await new UpdateRoleParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.roleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const role = await Repository.Roles().getById(new Types.ObjectId(idParams.id));
      if (!role) throw new NotFoundError('Role');

      const beforeRole = await Repository.Roles().findOneRaw(new Types.ObjectId(idParams.id));

      //old key redisdan o'chirish uchun kerak bo'ladi, chunki code yoki scope o'zgarsa, eski kalit bilan ma'lumot noto'g'ri bo'ladi
      const oldKey = `${process.env.NODE_ENV}:role:${role.getCode()}:scope:${role.getScope()}:permissions`;

      if (params.scope) {
        role.buildScope(params.scope);
      }

      if (params.name) {
        role.buildName(params.name);
      }

      if (params.code) {
        if (params.code !== role.getCode()) {
          const existed = await Repository.Roles().getByCode(params.code).catch(() => null);
          if (existed?.getId?.() && existed.getId().toString() !== role.getId().toString()) {
            return context.send.error({ message: 'Role code already exists' });
          }
        }
        role.buildCode(params.code);
      }

      if (Array.isArray(params.permissions)) {
        role.buildPermissions(params.permissions);
      }

      const updatedRole = await Repository.Roles().update(role);


      await ActionLogService.logSuccess({
              context,
              action: ActionTypeEnum.UPDATE,
              resource: 'role',
              resourceId: role.getId(),
              before: beforeRole as unknown as Record<string, unknown>,
              after: updatedRole.convertToSchema() as unknown as Record<string, unknown>,
            });

      const redis = await Redis.getInstance();
      await redis.delete(oldKey).catch(() => null);

      return context.send.data({ updated: true, id: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
              context,
              action: ActionTypeEnum.UPDATE,
              resource: 'Role',
              resourceId: new Types.ObjectId(idParams.id),
              failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
      return context.send.error(error);
    }
  }
}