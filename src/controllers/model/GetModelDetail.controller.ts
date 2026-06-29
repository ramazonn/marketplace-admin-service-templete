import { Context } from 'koa';
import { IdParams, ListParams } from '../../infrastructure';
import { CloudFlareService, LanguageEnum, ModelsEntity, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

class ModelDetailResponse {
  id: string;
  title: TranslatesSchema;
  description: TranslatesSchema;
  avatar: string;
  constructor(item: ModelsEntity, lang: LanguageEnum) {
    this.id = item.getId().toString();
    this.title = item.getTitle()?.convertToSchema();
    this.description = item.getDesc()?.convertToSchema();
    this.avatar = item.getAvatar() ? CloudFlareService.getImageUrlByFileID(item.getAvatar()) : null;
  }
}

@prefix('/model')
export default class GetModelDetailController {
  @request('get', '/detail/{modelId}')
  @summary('Model list')
  @security([])
  @tags(['Model'])
  @path({ modelId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.modelId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const model = await Repository.Models().getById(new Types.ObjectId(params.id));
      if (!model) {
        throw new NotFoundError('Model');
      }
      const response = new ModelDetailResponse(model, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
