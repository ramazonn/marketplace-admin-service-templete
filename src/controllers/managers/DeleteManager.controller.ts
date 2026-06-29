import { Context } from 'koa';
import { IdParams, StoreListParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, StoreStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { params, path, prefix, query, request, security, summary, swaggerClass, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { ActionLogService } from '../../services';

@prefix('/manager')
export default class DeleteManagerController {
  @request('delete', '/{managerId}')
  @summary('Manager delete')
  @security([])
  @tags(['Manager'])
  @path({ managerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.managerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const manager = await Repository.Managers().getById(new Types.ObjectId(params.id));
      if (!manager) {
        throw new NotFoundError('Manager');
      }

      const before = await Repository.Managers().findOneRaw(new Types.ObjectId(params.id));

      await Repository.Managers().deleteById(manager.getId());

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Manager',
        resourceId: new Types.ObjectId(params.id),
        before
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Manager',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
