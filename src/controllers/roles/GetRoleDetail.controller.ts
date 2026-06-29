import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, RolesEntity, RoleScopeEnum } from '@ubaytools/core';

class RoleResponse {
  id: string;
  scope: RoleScopeEnum;
  code: string;
  name: string;
  permissions: number[];
  isSystem: boolean;
  createdAt: Date;

  constructor(role: RolesEntity) {
    this.id = role.getId().toString();
    this.scope = role.getScope();
    this.code = role.getCode();
    this.name = role.getName();
    this.permissions = role.getPermissions?.() ?? [];
    this.isSystem = role.getIsSystem?.() ?? false;
    this.createdAt = role.getCreatedAt?.();
  }
}

@prefix('/roles')
export default class GetRoleDetailController {
  @request('get', '/detail/{roleId}')
  @summary('Role detail')
  @security([])
  @tags(['Roles'])
  @path({ roleId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;

    try {
      idParams = await new IdParams({ id: context.params.roleId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const role = await Repository.Roles().getById(new Types.ObjectId(idParams.id));
      if (!role) throw new NotFoundError('Role');

      return context.send.data(new RoleResponse(role as any));
    } catch (error) {
      return context.send.error(error);
    }
  }
}