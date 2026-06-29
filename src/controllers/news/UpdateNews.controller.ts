import { Context } from 'koa';
import { AddNewsParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NewsStatusEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { ActionLogService } from '../../services';

@prefix('/news')
export default class UpdateNewsController {
  @request('put', '/{newsId}')
  @summary('News update')
  @security([])
  @tags(['News'])
  @path({ newsId: { type: 'string', required: true } })
  @body((AddNewsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddNewsParams;
    let idParams: IdParams;
    try {
      params = await new AddNewsParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.newsId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const news = await Repository.News().getById(new Types.ObjectId(idParams.id));
      if (!news) {
        throw new NotFoundError('News');
      }

      const beforeNews = await Repository.News().findOneRaw(new Types.ObjectId(idParams.id));

      news
        .buildTitle(params.title)
        .buildDescription(params.description)
        .buildAttachment(params.attachment)
        .buildStatus(params.status)
        .buildLink(params.link)
        .buildStartDate(params.startDate)
        .buildEndDate(params.endDate);

      const afterNews = await Repository.News().update(news);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'news',
        resourceId: news.getId(),
        before: beforeNews as unknown as Record<string, unknown>,
        after: afterNews.convertToSchema() as unknown as Record<string, unknown>
      });

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:list:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:count`);

      if (params.status === NewsStatusEnum.ACTIVE) {
        try {
          const notificationService = new NotificationTemplateService();
          await notificationService.sendNewsNotification(
            params.title,
            params.description,
            {
              newsId: news.getId().toString(),
              deepLink: 'notify'
            },
            params.attachment?.[0] // Use first attachment as image if available
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
        resource: 'News',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
