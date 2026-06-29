import { Context } from 'koa';
import { query, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Repository, RolesEntity, RoleScopeEnum } from '@ubaytools/core';
import { ListParams, RoleListParams } from '../../infrastructure';

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
export default class RolesListController {
  @request('get', '/list')
  @summary('Roles list')
  @security([])
  @tags(['Roles'])
  @query((ListParams as any).swaggerDocument)
  @query((RoleListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    let params: RoleListParams;

    try {
      listParams = await new ListParams(context.request.query).validate();
      params = await new RoleListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const filter: any = {};

      if (params.scope) {
        filter.scope = params.scope;
      }

      if (params.search) {
        filter['$or'] = [
          { code: { $regex: params.search, $options: 'i' } },
          { name: { $regex: params.search, $options: 'i' } },
        ];
      }

      const sort = { createdAt: -1 };

      const count = await Repository.Roles().countDocumentsByFilter(filter);
      const roles = await Repository.Roles().list(
        { page: listParams.page, size: listParams.size },
        filter,
        sort,
      );

      const items = roles.map((role: any) => new RoleResponse(role));

      return context.send.data({
        count,
        items
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}