import { Context } from 'koa';
import { Repository, AdminsEntity, Password, BadRequestError, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { AddAdminParams } from '../../infrastructure';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/admins')
export default class AddAdminController {
  @request('post', '/add')
  @summary('Admin add')
  @security([])
  @tags(['Admins'])
  @body((AddAdminParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddAdminParams;
    try {
      params = await new AddAdminParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const existAdmin = await Repository.Admins().getByUsername(params.username)
      if (existAdmin) {
        throw new BadRequestError("Admin already exist ")
      }
      
      const hashedPassword = await new Password().buildPassword(params.password).hash();
      const admin = new AdminsEntity()
        .buildFirstName(params.firstName)
        .buildLastName(params.lastName)
        .buildPhoneNumber(params.phoneNumber)
        .buildRole(new Types.ObjectId(params.role))
        .buildScope(params.scope)
        .buildUsername(params.username)
        .buildPassword(hashedPassword)

        if(params.store) {
          admin.buildStore(new Types.ObjectId(params.store))
        }
      
      const createdAdmin = await Repository.Admins().create(admin);
      return context.send.data({ id: createdAdmin.getId().toString() });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
