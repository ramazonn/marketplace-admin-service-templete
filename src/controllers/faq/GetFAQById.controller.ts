import { Context } from 'koa';
import { IdParams, ListParams } from '../../infrastructure';
import { FaqEntity, FaqStatusEnum, FaqTypeEnum, LanguageEnum, Repository, TranslatesSchema } from '@ubaytools/core';
import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class FaqsFullDetailResponse {
  id: string;
  title: TranslatesSchema;
  description: TranslatesSchema;
  status: FaqStatusEnum;
  type: FaqTypeEnum;
  constructor(faq: FaqEntity, lang: LanguageEnum) {
    this.id = faq.getId().toString();
    this.title = faq.getTitle().convertToSchema();
    this.description = faq.getDescription().convertToSchema();
    this.status = faq.getStatus();
    this.type = faq.getType();
  }
}

@prefix('/faq')
export default class GetFAQByIdController {
  @request('get', '/detail/{faqId}')
  @summary('FAQ get by id')
  @security([])
  @tags(['FAQ'])
  @path({ faqId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.faqId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const faq = await Repository.Faqs().getById(new Types.ObjectId(params.id));
      const response = new FaqsFullDetailResponse(faq, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
