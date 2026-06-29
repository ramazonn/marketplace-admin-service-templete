import { Context } from 'koa';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

import {
  Repository,
  RoleAssignmentStatusEnum,
  RoleScopeEnum,
  RoleAssignmentsEntity,
  NotFoundError,
  BaseError,
} from '@ubaytools/core';
import { AssignRoleParams } from '../../infrastructure';


@prefix('/role-assignments')
export default class AssignRoleController {
  @request('post', '/assign')
  @summary('Assign role to admin')
  @security([])
  @tags(['RoleAssignments'])
  @body((AssignRoleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AssignRoleParams;

    try {
      params = await new AssignRoleParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const admin = new Types.ObjectId(params.admin);
      const role = new Types.ObjectId(params.role);
      const store = params.store ? new Types.ObjectId(params.store) : undefined;

      if (params.scope === RoleScopeEnum.STORE && !store) {
        throw new BaseError(
          'store is required for STORE scope',
          {
            en: 'store is required for STORE scope',
            ru: 'Для области STORE необходимо указать магазин',
            uz: 'STORE scope uchun store majburiy',
          },
          400,
        );
      }

      const roleEntity = await Repository.Roles().getById(role);
      if (!roleEntity) throw new NotFoundError('Role');

      const active = await Repository.RoleAssignments()
        .getActiveByAdminScope(admin, params.scope, store)
        .catch(() => null);

      if (active?.getId?.()) {
        active
          .buildRole(role)
          .buildStatus(RoleAssignmentStatusEnum.ACTIVE);

        if (params.scope === RoleScopeEnum.STORE) {
          active.buildStore(store);
        } else {
          active.buildStore(undefined);
        }

        await Repository.RoleAssignments().update(active);

        return context.send.data({
          updated: true,
          id: active.getId().toString(),
        });
      }

      const entity = new RoleAssignmentsEntity()
        .buildAdmin(admin)
        .buildRole(role)
        .buildScope(params.scope)
        .buildStatus(RoleAssignmentStatusEnum.ACTIVE);

      if (params.scope === RoleScopeEnum.STORE) {
        entity.buildStore(store);
      }

      const created = await Repository.RoleAssignments().create(entity);
      return context.send.data(created);
    } catch (error) {
      return context.send.error(error);
    }
  }
}