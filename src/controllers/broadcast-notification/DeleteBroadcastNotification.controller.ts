import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/broadcast-notification')
export default class DeleteBroadcastNotificationController {
  @request('delete', '/{broadcastNotificationId}')
  @summary('BroadcastNotification delete')
  @security([])
  @tags(['BroadcastNotification'])
  @path({ broadcastNotificationId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.broadcastNotificationId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const BroadcastNotification = await Repository.BroadcastNotification().getById(new Types.ObjectId(params.id));
      if (!BroadcastNotification) {
        throw new NotFoundError('BroadcastNotification');
      }
      const before = await Repository.BroadcastNotification().findOneRaw(new Types.ObjectId(params.id));
      await Repository.BroadcastNotification().deleteById(new Types.ObjectId(params.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'BroadcastNotification',
        resourceId: BroadcastNotification.getId(),
        before
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'BroadcastNotification',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

