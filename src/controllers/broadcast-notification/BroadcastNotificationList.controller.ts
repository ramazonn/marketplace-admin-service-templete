import { Context } from 'koa';
import { BroadcastNotificationListParams } from '../../infrastructure';
import { BroadcastNotificationEntity, LanguageEnum, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class BroadcastNotificationResponse {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  status: string;
  sentCount: number;
  failedCount: number;
  target: any;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(broadcastNotification: BroadcastNotificationEntity, lang: LanguageEnum) {
    this.id = broadcastNotification.getId().toString();
    this.title = broadcastNotification.getTitle()?.getByLang(lang) || '';
    this.text = broadcastNotification.getText()?.getByLang(lang) || '';
    this.imageUrl = broadcastNotification.getImageUrl();
    this.status = broadcastNotification.getStatus();
    this.sentCount = broadcastNotification.getSentCount();
    this.failedCount = broadcastNotification.getFailedCount();
    this.target = broadcastNotification.getTarget();
    this.metadata = broadcastNotification.getMetadata();
    this.createdAt = broadcastNotification.getCreatedAt();
    this.updatedAt = broadcastNotification.getUpdatedAt();
  }
}

@prefix('/broadcast-notification')
export default class BroadcastNotificationListController {
  @request('get', '/list')
  @summary('BroadcastNotification list')
  @security([])
  @tags(['BroadcastNotification'])
  @query((BroadcastNotificationListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: BroadcastNotificationListParams;
    try {
      params = await new BroadcastNotificationListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter = {};
      if (params.search) {
        filter['$or'] = [
          { 'title.uz': { $regex: params.search, $options: 'i' } },
          { 'title.ru': { $regex: params.search, $options: 'i' } },
          { 'title.en': { $regex: params.search, $options: 'i' } },
          { 'text.uz': { $regex: params.search, $options: 'i' } },
          { 'text.ru': { $regex: params.search, $options: 'i' } },
          { 'text.en': { $regex: params.search, $options: 'i' } },
        ];
      }
      const total = await Repository.BroadcastNotification().countDocumentsByFilter(filter);
      const broadcastNotifications = await Repository.BroadcastNotification().list(
        { page: params.page, size: params.size },
        filter,
        { createdAt: -1 }
      );
      const result = broadcastNotifications.map((item) => new BroadcastNotificationResponse(item, context.lang));
      return context.send.data({ total, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}

