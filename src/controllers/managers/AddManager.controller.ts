import { Context } from 'koa';
import { ActionLogFailureReasonEnum, ActionTypeEnum, ManagersEntity, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { ActionLogService } from '../../services';

@prefix('/manager')
export default class AddManagerController {
  @request('post', '/add')
  @summary('Manager add')
  @security([])
  @tags(['Manager'])
  @body({ name: { type: 'string', required: true }, sapId: { type: 'number', required: false } })
  static async controller(context: Context): Promise<void> {
    try {
      const manager = new ManagersEntity().buildName((context.request.body as any).name).buildSapId((context.request.body as any).sapId);

      const created = await Repository.Managers().create(manager);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Manager',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Manager',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
