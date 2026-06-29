import { Context } from 'koa';
import { LanguageEnum, ProductEntity, Repository, SpecialEventEntity, SpecialEventProductEntity, SpecialEventStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ListParams } from '../../infrastructure';
import { GetSpecialEventProductDetailUseCase, SpecialEventProductItemResponse} from '../../usecases';

class SpecialEventListItemResponse {
  
  id: string;
  name: TranslatesSchema;
  description: TranslatesSchema;
  backgroundImageMobile: string;
  backgroundImageWeb: string;
  startAt: Date;
  endAt: Date;
  daysOfWeek: Array<number>;
  eventProductLimit: number;
  eventLimitDuration: number;  
  status: SpecialEventStatusEnum;
  products: Array<SpecialEventProductItemResponse>;

    constructor(specialEvent: SpecialEventEntity,products: Array<SpecialEventProductItemResponse>, lang: LanguageEnum) {
        this.id = specialEvent.getId().toString();
        this.name = specialEvent.getName().convertToSchema();
        this.description = specialEvent.getDescription().convertToSchema() ?? null;
        this.backgroundImageMobile = specialEvent.getBackgroundImageMobile() ?? null;    
        this.backgroundImageWeb = specialEvent.getBackgroundImageWeb() ?? null;
        this.startAt = specialEvent.getStartAt() ?? null;
        this.endAt = specialEvent.getEndAt() ?? null;
        this.daysOfWeek = specialEvent.getDaysOfWeek() ?? null;
        this.eventProductLimit = specialEvent.getEventProductLimit() ?? 0;
        this.eventLimitDuration = specialEvent.getEventLimitDuration() ?? 0;
      this.status = specialEvent.getStatus();
    this.products= products??[];
      
    }
  }

@prefix('/special-event')
export default class SpecialEventListController {
  @request('get', '/list')
  @summary('Get Special Event list')
  @security([])
  @tags(['Special Event'])
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
      const count = await Repository.SpecialEvents().countDocumentsByFilter({});
      const specialEvents = await Repository.SpecialEvents().list({ page: params.page, size: params.size });
      const response = await Promise.all(
        specialEvents.map(async (specialEvent: SpecialEventEntity) => {
          const products = await Promise.all(
            specialEvent.getProducts().map(async (specialEventProduct: SpecialEventProductEntity) => {
              const product = specialEventProduct.getProduct() as ProductEntity
              const discountPercent = specialEventProduct.getDiscountPercent()
              const discountPrice = specialEventProduct.getDiscountPrice()
              const specialEventProductLimit = specialEventProduct.getProductLimit()
              const limitForSale = specialEventProduct.getLimitForSale()
              const soldCount = specialEventProduct.getSoldCount()
              const isActive = specialEventProduct.getIsActive()
              return await GetSpecialEventProductDetailUseCase.execute(product.getId().toHexString(), context.lang, specialEventProductLimit, discountPercent, discountPrice, limitForSale,soldCount, isActive,context?.client?.getId() ?? null);
            }),
          );
          return new SpecialEventListItemResponse(specialEvent, products, context.lang);
        })
      );

      return context.send.data({ total: count, items: response } );
    } catch (error) {
      return context.send.error(error);
    }
  }
} 