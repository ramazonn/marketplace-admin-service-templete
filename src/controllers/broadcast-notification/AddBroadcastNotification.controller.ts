import { Context } from 'koa';
import { AddBroadcastNotificationParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BroadcastNotificationEntity, BroadcastNotificationStatusEnum, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { ActionLogService } from '../../services';

@prefix('/broadcast-notification')
export default class AddBroadcastNotificationController {
  @request('post', '/add')
  @summary('BroadcastNotification add')
  @security([])
  @tags(['BroadcastNotification'])
  @body((AddBroadcastNotificationParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddBroadcastNotificationParams;
    try {
      params = await new AddBroadcastNotificationParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const broadcastNotification = new BroadcastNotificationEntity()
        .buildTitle(params.title)
        .buildText(params.text)
        .buildImageUrl(params.imageUrl)
        .buildStatus(params.status)
        .buildTarget(params.target)
        .buildMetadata(params.metadata);

      const created = await Repository.BroadcastNotification().create(broadcastNotification);
      if (params.status === BroadcastNotificationStatusEnum.PUBLISHED) {
        try {
          const notificationService = new NotificationTemplateService();
          await notificationService.sendBroadcastNotification(
            params.title,
            params.text,
            {
              broadcastId: created.getId().toString(),
              deepLink: `broadcast-notification/${created.getId().toString()}`,
              imageUrl: params.imageUrl
            },
            params.imageUrl // Use first attachment as image if available
          );
        } catch (notificationError) {
          console.error('Failed to send news notification:', notificationError);
          // Don't fail the main operation if notification fails
        }
      }
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'BroadcastNotification',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'BroadcastNotification',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

