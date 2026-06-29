import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { PartnerBrandsEntity, CloudFlareService, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class PartnerBrandListItemResponse {
  id: string;
  name: string;
  logo: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partnerBrand: PartnerBrandsEntity) {
    this.id = partnerBrand.getId().toString();
    this.name = partnerBrand.getName();
    this.logo = partnerBrand.getLogo() ? CloudFlareService.getImageUrlByFileID(partnerBrand.getLogo()) : null;
    this.createdAt = partnerBrand.getCreatedAt();
    this.updatedAt = partnerBrand.getUpdatedAt();
  }
}

@prefix('/partner-brands')
export default class PartnerBrandsListController {
  @request('get', '/list')
  @summary('PartnerBrands list')
  @security([])
  @tags(['PartnerBrands'])
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
      const count = await Repository.PartnerBrands().countDocumentsByFilter({});
      const partnerBrands = await Repository.PartnerBrands().list({ page: params.page, size: params.size }, {}, { createdAt: -1 });
      const result = partnerBrands.map((partnerBrand) => new PartnerBrandListItemResponse(partnerBrand));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}

