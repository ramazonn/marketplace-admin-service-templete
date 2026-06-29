import { Context } from 'koa';
import { IdParams, UpdatePartnerBrandsParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/partner-brands')
export default class UpdatePartnerBrandsController {
  @request('put', '/{partnerBrandId}')
  @summary('PartnerBrands update')
  @security([])
  @tags(['PartnerBrands'])
  @path({ partnerBrandId: { type: 'string', required: true } })
  @body((UpdatePartnerBrandsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdatePartnerBrandsParams;
    try {
      idParams = await new IdParams({ id: context.params.partnerBrandId }).validate();
      params = await new UpdatePartnerBrandsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const partnerBrand = await Repository.PartnerBrands().getById(new Types.ObjectId(idParams.id));
      if (!partnerBrand) {
        throw new NotFoundError('PartnerBrand');
      }
      const beforePartnerBrand = await Repository.PartnerBrands().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.name) partnerBrand.buildName(params.name);
      if (params.logo) partnerBrand.buildLogo(params.logo);
      const afterPartnerBrand = await Repository.PartnerBrands().update(partnerBrand);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'PartnerBrand',
        resourceId: afterPartnerBrand.getId(),
        before: beforePartnerBrand as unknown as Record<string, unknown>,
        after: afterPartnerBrand.convertToSchema() as unknown as Record<string, unknown>
      });

      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'PartnerBrand',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

