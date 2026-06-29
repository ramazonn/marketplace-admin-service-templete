import { Context } from 'koa';
import { IdParams, AddAdminParams,UpdateAdminParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BadRequestError, NotFoundError, Password, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/admins')
export default class UpdateAdminController {
  @request('put', '/{adminId}')
  @summary('Admin update')
  @security([])
  @tags(['Admins'])
  @path({ adminId: { type: 'string', required: true } })
  @body((UpdateAdminParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateAdminParams;
    try {
      
      idParams = await new IdParams({ id: context.params.adminId }).validate();
      params = await new UpdateAdminParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const admin = await Repository.Admins().getById(new Types.ObjectId(idParams.id));
      if (!admin) {
        throw new NotFoundError('Admin');
      }
      const before = await Repository.Admins().findOneRaw(new Types.ObjectId(idParams.id))
      if (params.username) {
        
        const existAdmin = await Repository.Admins().getByUsername(params.username)
        if (existAdmin && (existAdmin.getId().toString() !== admin.getId().toString())) {
          throw new BadRequestError("Admin already exist ")
        }

        
        admin.buildUsername(params.username) 
        
      };
      if (params.firstName) admin.buildFirstName(params.firstName);
      if (params.lastName) admin.buildLastName(params.lastName);
      if (params.phoneNumber) admin.buildPhoneNumber(params.phoneNumber);
      if (params.role) admin.buildRole(new Types.ObjectId(params.role));
      if (params.status) admin.buildStatus(params.status);
      if(params.scope) admin.buildScope(params.scope);
      if(params.store) admin.buildStore(new Types.ObjectId(params.store));
      if (params.password) {
        const hashedPassword = await new Password().buildPassword(params.password).hash();
        admin.buildPassword(hashedPassword);
      };
      const updated = await Repository.Admins().update(admin);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Admin',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Admin',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
