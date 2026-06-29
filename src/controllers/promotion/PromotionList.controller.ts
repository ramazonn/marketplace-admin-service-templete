import { Context } from 'koa';
import { PromotionPageEnum, PromotionsEntity, Repository, TranslatesSchema } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { PromotionTypeEnum } from '@ubaytools/core';

class PromotionListItemResponse {
  id: string;
  type: PromotionTypeEnum;
  attachment: TranslatesSchema;
  startDate: Date;
  endDate: Date;
  link: string;
  order: number;
  page: PromotionPageEnum;
  screen?: string;
  screenId?: string;

  constructor(promotion: PromotionsEntity) {
    this.id = promotion.getId().toString();
    this.type = promotion.getType();
    this.attachment = promotion.getAttachment()?.convertToSchema();
    this.startDate = promotion.getStartDate();
    this.endDate = promotion.getEndDate();
    this.link = promotion.getLink();
    this.order = promotion.getOrder();
    this.page = promotion.getPage();
    this.screen = promotion.getScreen()??null;
    this.screenId = promotion.getScreenId()??null;
  }
}

@prefix('/promotion')
export default class PromotionListController {
  @request('get', '/list')
  @summary('Promotion list')
  @security([])
  @tags(['Promotion'])
  @query({ page: { type: 'string', required: false }, type:{type:"string",required: false} })
  static async controller(context: Context): Promise<void> {
    try {
      const page = context.request.query?.page as PromotionPageEnum;
      const type = context.request.query?.type as PromotionTypeEnum;
      const filter: any = {}
      if(page) filter.page = page
      if(type) filter.type = type
      let promotions = await Repository.Promotions().list({ page: 1, size: 100 }, filter, { order: 1 });
      console.log(promotions)
      // if (page) promotions = promotions.filter((item) => item.getPage() == page);
      const response = promotions.map((item) => new PromotionListItemResponse(item));
      return context.send.data({ total: promotions.length, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
