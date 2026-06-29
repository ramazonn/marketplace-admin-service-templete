import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { LanguageEnum, NewsEntity, Repository, TranslatesSchema } from '@ubaytools/core';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

class NewsFullResponse {
  id: string;
  title: TranslatesSchema;
  description: TranslatesSchema;
  status: string;
  attachment: TranslatesSchema;
  startDate: Date;
  endDate: Date;
  link: string;
  createdAt: Date;
  constructor(news: NewsEntity, lang: LanguageEnum) {
    this.id = news.getId().toString();
    this.title = news.getTitle().convertToSchema();
    this.description = news.getDescription().convertToSchema();
    this.status = news.getStatus();
    this.attachment = news.getAttachment().convertToSchema();
    this.startDate = news.getStartDate();
    this.endDate = news.getEndDate();
    this.link = news.getLink();
    this.createdAt = news.getCreatedAt();
  }
}

@prefix('/news')
export default class GetNewsByIdController {
  @request('get', '/detail/{newsId}')
  @summary('News get by id')
  @security([])
  @tags(['News'])
  @path({ newsId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.newsId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const news = await Repository.News().getById(new Types.ObjectId(params.id));
      const result = new NewsFullResponse(news, context.lang);
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
