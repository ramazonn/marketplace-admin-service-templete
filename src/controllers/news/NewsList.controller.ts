import { Context } from 'koa';
import { ListParams, NewsListParams } from '../../infrastructure';
import { LanguageEnum, NewsEntity, Repository, TranslatesSchema } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class NewsResponse {
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
    this.title = news.getTitle()?.convertToSchema() ?? {};
    this.description = news.getDescription()?.convertToSchema() ?? {};
    this.status = news.getStatus();
    this.attachment = news.getAttachment()?.convertToSchema() ?? {};
    this.startDate = news.getStartDate();
    this.endDate = news.getEndDate();
    this.link = news.getLink();
    this.createdAt = news.getCreatedAt();
  }
}

@prefix('/news')
export default class NewsListController {
  @request('get', '/list')
  @summary('News list')
  @security([])
  @tags(['News'])
  @query((NewsListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: NewsListParams;
    try {
      params = await new NewsListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter = {};
      if (params.search) {
        filter['$or'] = [
          { 'title.uz': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'title.uz'
          { 'title.ru': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'title.ru'
          { 'title.en': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'title.en'
        ];
      }
      const totalNews = await Repository.News().countDocumentsByFilter(filter);
      const newsList = await Repository.News().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      const result = newsList.map((news) => new NewsResponse(news, context.lang));
      return context.send.data({ total: totalNews, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
