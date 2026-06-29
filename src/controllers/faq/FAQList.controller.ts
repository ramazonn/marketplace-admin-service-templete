import { Context } from 'koa';
import { FaqListParams, ListParams } from '../../infrastructure';
import { FaqEntity, FaqsModel, FaqStatusEnum, FaqTypeEnum, LanguageEnum, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

export class FaqsResponse {
  id: string;
  title: string;
  description: string;
  status: FaqStatusEnum;
  type: FaqTypeEnum;
  constructor(faq: FaqEntity, lang: LanguageEnum) {
    this.id = faq.getId().toString();
    this.title = faq.getTitle().getByLang(lang);
    this.description = faq.getDescription().getByLang(lang);
    this.status = faq.getStatus();
    this.type = faq.getType();
  }
}

@prefix('/faq')
export default class FAQListController {
  @request('get', '/list')
  @summary('FAQ list')
  @security([])
  @tags(['FAQ'])
  @query((FaqListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: FaqListParams;
    try {
      params = await new FaqListParams(context.request.query).validate();
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
          { 'description.uz': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'description.uz'
          { 'description.ru': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'description.ru'
          { 'description.en': { $regex: params.search, $options: 'i' } }, // Case-insensitive search for 'description.en'
        ];
      }
      if (params.type && params.type != FaqTypeEnum.DEFAULT) {
        filter['type'] = params.type;
      }
      const counts = await FaqsModel.aggregate([
        {
          $facet: {
            TECHNICAL: [
              { $match: { type: 'TECHNICAL'} },
              { $count: "count" }
            ],
            ORDER: [
              { $match: { type: 'ORDER'} },
              { $count: "count" }
            ],
            DELIVERY: [
              { $match: { type: 'DELIVERY'} },
              { $count: "count" }
            ],
            PAYMENT: [
              { $match: { type: 'PAYMENT'} },
              { $count: "count" }
            ],
            total: [
              { $count: "count" }
            ]
          }
        },
        {
          $project: {
            TECHNICAL: { $ifNull: [{ $arrayElemAt: ["$TECHNICAL.count", 0] }, 0] },
            PAYMENT: { $ifNull: [{ $arrayElemAt: ["$PAYMENT.count", 0] }, 0] },
            DELIVERY: { $ifNull: [{ $arrayElemAt: ["$DELIVERY.count", 0] }, 0] },
            ORDER: { $ifNull: [{ $arrayElemAt: ["$ORDER.count", 0] }, 0] },
            TOTAL: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] }
          }
        }
      ])
      
      const faqs = await Repository.Faqs().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      const response = faqs.map((faq) => new FaqsResponse(faq, context.lang));
      return context.send.data({ counts: counts[0], items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
