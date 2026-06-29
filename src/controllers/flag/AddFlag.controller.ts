import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { AddFlagParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, FlagEntity, Repository } from '@ubaytools/core';
import { ActionLogService } from '../../services';

@prefix('/flag')
export default class AddFlagController {
  @request('post', '/add')
  @summary('Flag add')
  @security([])
  @tags(['Flag'])
  @body((AddFlagParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddFlagParams;
    try {
      params = await new AddFlagParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const flag = new FlagEntity().buildName(params.name).buildColor(params.color);

      const created = await Repository.Flags().create(flag);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Flag',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ created: true, id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Flag',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
