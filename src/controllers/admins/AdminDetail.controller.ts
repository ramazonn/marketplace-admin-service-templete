import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import {  AdminsEntity, RolesEnum, NotFoundError, Repository, AdminStatusEnum, RolesSchema, RolesEntity, StoresEntity } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class AdminDetailResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  role: {
    id: string,
    name: string
  };
  store: { id: string; name: string; };
  scope: string;
  status:AdminStatusEnum
  constructor(admin: AdminsEntity) {
    this.id = admin.getId().toString();
    this.firstName = admin.getFirstName();
    this.lastName = admin.getLastName();
    this.username = admin.getUsername();
    this.phoneNumber = admin.getPhoneNumber();
    this.role =  admin.getRole() ? {
      id: (admin.getRole() as RolesEntity).getId().toString(),
      name: (admin.getRole() as RolesEntity).getName().toString()
    } : null;
    this.status = admin.getStatus();
    this.store = admin.getStore()
          ? {
              id: (admin.getStore() as StoresEntity)?.getId()?.toString() ?? null,
              name: (admin.getStore() as StoresEntity)?.getName?.() ?? null,
            }
          : null;
    this.scope = admin.getScope()?.toString();
  }
}

@prefix('/admins')
export default class AdminDetailController {
  @request('get', '/detail/{adminId}')
  @summary('Admin detail')
  @security([])
  @tags(['Admins'])
  @path({ adminId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.adminId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const foundAdmin = await Repository.Admins().getById(new Types.ObjectId(params.id));
      if (!foundAdmin) {
        throw new NotFoundError('Admin by id');
      }
      const response = new AdminDetailResponse(foundAdmin);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
