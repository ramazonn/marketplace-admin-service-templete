import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { BrandsEntity, CloudFlareService, LanguageEnum, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
class BrandResponse {
  id: string;
  title: string;
  desc: string;
  avatar: string;
  constructor(brand: BrandsEntity, lang: LanguageEnum) {
    this.id = brand.getId().toString();
    this.title = brand.getTitle()?.getByLang(lang);
    this.desc = brand.getDesc()?.getByLang(lang);
    this.avatar = brand.getAvatar() ? CloudFlareService.getImageUrlByFileID(brand.getAvatar()) : null;
  }
}

@prefix('/brand')
export default class BrandListController {
  @request('get', '/list')
  @summary('Brand list')
  @security([])
  @tags(['Brand'])
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
      const count = await Repository.Brands().countDocumentsByFilter({});
      const brands = await Repository.Brands().list({ page: params.page, size: params.size }, {}, { createdAt: -1 });
      const result = brands.map((brand) => new BrandResponse(brand, context.lang));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
