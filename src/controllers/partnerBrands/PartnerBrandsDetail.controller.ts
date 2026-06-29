import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { PartnerBrandsEntity, CloudFlareService, NotFoundError, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class PartnerBrandsDetailResponse {
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
export default class PartnerBrandsDetailController {
  @request('get', '/detail/{partnerBrandId}')
  @summary('PartnerBrands detail')
  @security([])
  @tags(['PartnerBrands'])
  @path({ partnerBrandId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.partnerBrandId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const foundPartnerBrand = await Repository.PartnerBrands().getById(new Types.ObjectId(params.id));
      if (!foundPartnerBrand) {
        throw new NotFoundError('PartnerBrand');
      }
      const response = new PartnerBrandsDetailResponse(foundPartnerBrand);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}

