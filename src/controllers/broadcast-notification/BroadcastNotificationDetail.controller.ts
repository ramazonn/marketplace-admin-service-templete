import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { BroadcastNotificationEntity, LanguageEnum, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

class BroadcastNotificationFullResponse {
  id: string;
  title: TranslatesSchema;
  text: TranslatesSchema;
  imageUrl: string;
  status: string;
  sentCount: number;
  failedCount: number;
  target: any;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(broadcastNotification: BroadcastNotificationEntity) {
    this.id = broadcastNotification.getId().toString();
    this.title = broadcastNotification.getTitle()?.convertToSchema();
    this.text = broadcastNotification.getText()?.convertToSchema();
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
export default class BroadcastNotificationDetailController {
  @request('get', '/detail/{broadcastNotificationId}')
  @summary('BroadcastNotification get by id')
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
      const broadcastNotification = await Repository.BroadcastNotification().getById(new Types.ObjectId(params.id));
      if (!broadcastNotification) {
        throw new NotFoundError('BroadcastNotification');
      }
      const result = new BroadcastNotificationFullResponse(broadcastNotification);
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}

