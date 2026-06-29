import { Context } from 'koa';
import { IdParams, StoreListParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, StoreStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, params, path, prefix, query, request, security, summary, swaggerClass, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { ActionLogService } from '../../services';

@prefix('/manager')
export default class UpdateManagerController {
  @request('put', '/{managerId}')
  @summary('Manager update')
  @security([])
  @tags(['Manager'])
  @path({ managerId: { type: 'string', required: true } })
  @body({ name: { type: 'string', required: true }, sapId: { type: 'number', required: false } })
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

      manager.buildName((context.request.body as any).name).buildSapId((context.request.body as any).sapId);

      const updated = await Repository.Managers().update(manager);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Manager',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Manager',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
