import { Context } from 'koa';
import { ListParams, ModelListParams } from '../../infrastructure';
import { CloudFlareService, LanguageEnum, ModelsEntity, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

class ModelListItemResponse {
  id: string;
  title: string;
  description: string;
  avatar: string;
  constructor(item: ModelsEntity, lang: LanguageEnum) {
    this.id = item.getId().toString();
    this.title = item.getTitle()?.getByLang(lang);
    this.description = item.getDesc()?.getByLang(lang);
    this.avatar = item.getAvatar() ? CloudFlareService.getImageUrlByFileID(item.getAvatar()) : null;
  }
}

@prefix('/model')
export default class ModelListController {
  @request('get', '/list')
  @summary('Model list')
  @security([])
  @tags(['Model'])
  @query((ModelListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ModelListParams;
    try {
      params = await new ModelListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {};
      if (params.search) {
        filter['$or'] = [
          { 'title.uz': { $regex: params.search, $options: 'i' } },
          { 'title.ru': { $regex: params.search, $options: 'i' } },
          { 'title.en': { $regex: params.search, $options: 'i' } },
          { 'description.uz': { $regex: params.search, $options: 'i' } },
          { 'description.ru': { $regex: params.search, $options: 'i' } },
          { 'description.en': { $regex: params.search, $options: 'i' } },
        ];
      }
      const count = await Repository.Models().countDocumentsByFilter(filter);
      let models;
      if (params.currentId) {
        if (params.page === 1) {
          const firstModel = await Repository.Models().getById(new Types.ObjectId(params.currentId));
          if (firstModel) models = [firstModel];
          const others = await Repository.Models().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
          const temp = others.filter((model) => !model.getId().equals(new Types.ObjectId(params.currentId)));
          models = [...models, ...temp];
          if (models.length > params.size) models.pop();
        } else {
          models = await Repository.Models().list({ page: params.page, size: params.size + 1 }, filter, { createdAt: -1 });
          models = models.filter((model) => !model.getId().equals(new Types.ObjectId(params.currentId)));
          if (models.length > params.size) {
            models.pop();
          }
        }
      } else {
        models = await Repository.Models().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      }

      const response = models.map((item) => new ModelListItemResponse(item, context.lang));
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
