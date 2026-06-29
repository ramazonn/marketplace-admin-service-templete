import { Context } from 'koa';
import { AddNewsParams, IdParams } from '../../infrastructure';
import { NewsStatusEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/news')
export default class CancelNewsController {
  @request('post', '/cancel/{newsId}')
  @summary('News cancel')
  @security([])
  @tags(['News'])
  @path({ newsId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.newsId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const news = await Repository.News().getById(new Types.ObjectId(params.id));
      if (!news) {
        throw new NotFoundError('News');
      }
      news.buildStatus(NewsStatusEnum.INACTIVE);
      await Repository.News().update(news);
      return context.send.data({ canceled: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
