import { Context } from 'koa';
import { AddPartnerBrandsParams } from '../../infrastructure';
import { Repository, PartnerBrandsEntity, ActionLogFailureReasonEnum, ActionTypeEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/partner-brands')
export default class AddPartnerBrandsController {
  @request('post', '/add')
  @summary('PartnerBrands add')
  @security([])
  @tags(['PartnerBrands'])
  @body((AddPartnerBrandsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddPartnerBrandsParams;
    try {
      params = await new AddPartnerBrandsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const partnerBrand = new PartnerBrandsEntity()
        .buildName(params.name)
        .buildLogo(params.logo);

      const createdPartnerBrand = await Repository.PartnerBrands().create(partnerBrand);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'PartnerBrand',
        resourceId: createdPartnerBrand.getId(),
        after: createdPartnerBrand.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: createdPartnerBrand.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'PartnerBrand',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

