import { Context } from 'koa';
import { IdParams, UpdateBroadcastNotificationParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BroadcastNotificationStatusEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { ActionLogService } from '../../services';

@prefix('/broadcast-notification')
export default class UpdateBroadcastNotificationController {
  @request('put', '/{broadcastNotificationId}')
  @summary('BroadcastNotification update')
  @security([])
  @tags(['BroadcastNotification'])
  @path({ broadcastNotificationId: { type: 'string', required: true } })
  @body((UpdateBroadcastNotificationParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateBroadcastNotificationParams;
    let idParams: IdParams;
    try {
      params = await new UpdateBroadcastNotificationParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.broadcastNotificationId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const broadcastNotification = await Repository.BroadcastNotification().getById(new Types.ObjectId(idParams.id));
      if (!broadcastNotification) {
        throw new NotFoundError('BroadcastNotification');
      }

      const before = await Repository.BroadcastNotification().findOneRaw(new Types.ObjectId(idParams.id));
      
      if (params.title !== undefined) broadcastNotification.buildTitle(params.title);
      if (params.text !== undefined) broadcastNotification.buildText(params.text);
      if (params.imageUrl !== undefined) broadcastNotification.buildImageUrl(params.imageUrl);
      if (params.status !== undefined) broadcastNotification.buildStatus(params.status);
      if (params.target !== undefined) broadcastNotification.buildTarget(params.target);
      if (params.metadata !== undefined) broadcastNotification.buildMetadata(params.metadata);
      
        const updated = await Repository.BroadcastNotification().update(broadcastNotification);
        await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'BroadcastNotification',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
        if (params.status === BroadcastNotificationStatusEnum.PUBLISHED) {
            try {
                const notificationService = new NotificationTemplateService();
                await notificationService.sendBroadcastNotification(
                  updated.getTitle()?.convertToSchema(),
                  updated.getText()?.convertToSchema(),
                  {
                    broadcastId: updated.getId().toString(),
                      deepLink: `broadcast-notification/${updated.getId().toString()}`,
                      imageUrl: updated.getImageUrl()
                  },
                  updated.getImageUrl()
                );
              } catch (notificationError) {
                console.error('Failed to send news notification:', notificationError);
                // Don't fail the main operation if notification fails
              }
            }
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'BroadcastNotification',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

