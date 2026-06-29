import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { AdminsEntity, AdminStatusEnum, Repository, RolesEntity, RolesEnum, StoresEntity } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
class AdminResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  role: { id: string; name: string; };
  store: { id: string; name: string; };
  scope: string;
  status: AdminStatusEnum;

  constructor(admin: AdminsEntity) {
    this.id = admin.getId()?.toString() ?? null;
    this.firstName = admin.getFirstName() ?? null;
    this.lastName = admin.getLastName() ?? null;
    this.username = admin.getUsername() ?? null;
    this.phoneNumber = admin.getPhoneNumber() ?? null;
    this.status = admin.getStatus() ?? null;
    this.role = admin.getRole()
      ? {
          id: (admin.getRole() as RolesEntity)?.getId()?.toString() ?? null,
          name: (admin.getRole() as RolesEntity)?.getName?.()?.toString?.() ?? (admin.getRole() as RolesEntity)?.getCode?.()?.toString?.() ?? null,
        }
      : null;
    this.store = admin.getStore()
      ? {
          id: (admin.getStore() as StoresEntity)?.getId()?.toString() ?? null,
          name: (admin.getStore() as StoresEntity)?.getName?.() ?? null,
        }
      : null;
    this.scope = admin.getScope()?.toString() ?? null;
  }
}

@prefix('/admins')
export default class AdminListController {
  @request('get', '/list')
  @summary('Admin list')
  @security([])
  @tags(['Admins'])
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ListParams;
    try {
      params = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.Admins().countDocumentsByFilter({});
      const Admins = await Repository.Admins().list({ page: params.page, size: params.size }, {}, { createdAt: -1 });
      const result = Admins.map((Admin) => new AdminResponse(Admin));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
