import { Context } from 'koa';
import { AddNewsParams, AddSellerParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NewsEntity, NewsStatusEnum, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { ActionLogService } from '../../services';

@prefix('/news')
export default class AddNewsController {
  @request('post', '/add')
  @summary('News add')
  @security([])
  @tags(['News'])
  @body((AddNewsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddNewsParams;
    let result;
    try {
      params = await new AddNewsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const news = new NewsEntity()
        .buildTitle(params.title)
        .buildDescription(params.description)
        .buildAttachment(params.attachment)
        .buildLink(params.link)
        .buildStartDate(params.startDate)
        .buildEndDate(params.endDate)
        .buildStatus(params.status);
      const created = await Repository.News().create(news);

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:list:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:count`);

      // Send notification to all users about the new news
      if (params.status === NewsStatusEnum.ACTIVE) {
        try {
          const notificationService = new NotificationTemplateService();
          await notificationService.sendNewsNotification(
            params.title,
            params.description,
            {
              newsId: created.getId().toString(),
              deepLink: 'notify'
            },
            params.attachment?.[0] // Use first attachment as image if available
          );
        } catch (notificationError) {
          console.error('Failed to send news notification:', notificationError);
          // Don't fail the main operation if notification fails
        }
      }

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'News',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'News',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
