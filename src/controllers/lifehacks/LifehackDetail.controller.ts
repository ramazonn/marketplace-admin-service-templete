import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { LifehacksEntity, NotFoundError, ProductEntity, Repository, LanguageEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class LifehacksDetailResponse {
  id: string;
  videoLink: string;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  product: {
    id: string;
    title: string;
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
          title: product.getName()?.getByLang(lang) ?? '',
          images: product.getAttachments() ?? [],
        }
        : null;
  }
}

@prefix('/lifehacks')
export default class LifehackDetailController {
  @request('get', '/detail/{lifehackId}')
  @summary('Lifehacks detail')
  @security([])
  @tags(['Lifehacks'])
  @path({ lifehackId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.lifehackId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const lang = (context.language || LanguageEnum.EN) as LanguageEnum;

      const foundLifehack = await Repository.Lifehacks().getById(
        new Types.ObjectId(params.id),
      );

      if (!foundLifehack) {
        throw new NotFoundError('Lifehack by id');
      }

      const response = new LifehacksDetailResponse(foundLifehack, lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}