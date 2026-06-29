import { Types } from 'mongoose';
import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { BrandsEntity, CloudFlareService, LanguageEnum, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class BrandDetailResponse {
  id: string;
  title: TranslatesSchema;
  description: TranslatesSchema;
  avatar: string;
  constructor(brand: BrandsEntity, lang: LanguageEnum) {
    this.id = brand.getId().toString();
    this.title = brand.getTitle()?.convertToSchema();
    this.description = brand.getDesc()?.convertToSchema();
    this.avatar = brand.getAvatar() ? CloudFlareService.getImageUrlByFileID(brand.getAvatar()) : null;
  }
}

@prefix('/brand')
export default class BrandDetailController {
  @request('get', '/detail/{brandId}')
  @summary('Brand detail')
  @security([])
  @tags(['Brand'])
  @path({ brandId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.brandId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const foundBrand = await Repository.Brands().getById(new Types.ObjectId(params.id));
      if (!foundBrand) {
        throw new NotFoundError('Brand by id');
      }
      const response = new BrandDetailResponse(foundBrand, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
