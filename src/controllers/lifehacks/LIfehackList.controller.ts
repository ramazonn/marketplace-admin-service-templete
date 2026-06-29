import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import {
  LanguageEnum,
  LifehacksEntity,
  ProductEntity,
  Repository,
  TranslatesSchema,
} from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class LifehacksResponse {
  id: string;
  videoLink: string;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  product: {
    id: string;
    name: TranslatesSchema | string;
    images: string[];
  } | null;

  constructor(lifehack: LifehacksEntity, lang: LanguageEnum) {
    const product = lifehack.getProduct();

    this.id = lifehack.getId()?.toString();
    this.videoLink = lifehack.getVideoLink();
    this.likesCount = lifehack.getLikesCount();
    this.commentsCount = lifehack.getCommentsCount();
    this.viewCount = lifehack.getViewCount();
    this.product =
      product instanceof ProductEntity
        ? {
            id: product.getId()?.toString(),
            name: product.getName()?.convertToSchema() ?? '',
            images: product.getAttachments() ?? [],
          }
        : null;
  }
}

@prefix('/lifehacks')
export default class LifehackListController {
  @request('get', '/list')
  @summary('Lifehack list')
  @security([])
  @tags(['Lifehacks'])
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ListParams;

    try {
      params = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const lang = (context.language || LanguageEnum.EN) as LanguageEnum;

      const count = await Repository.Lifehacks().countDocumentsByFilter({});
      const lifehacks = await Repository.Lifehacks().list(
        { page: params.page, size: params.size },
        {},
        { createdAt: -1 },
      );

      const result = lifehacks.map(
        (lifehack) => new LifehacksResponse(lifehack, lang),
      );

      return context.send.data({
        total: count,
        items: result,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}