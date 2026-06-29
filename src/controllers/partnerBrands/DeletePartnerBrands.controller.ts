import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/partner-brands')
export default class DeletePartnerBrandsController {
  @request('delete', '/{partnerBrandId}')
  @summary('PartnerBrands delete')
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
      const beforePartnerBrand = await Repository.PartnerBrands().findOneRaw(new Types.ObjectId(params.id));
      if (!beforePartnerBrand) {
        throw new NotFoundError('PartnerBrand')
      }
      await Repository.PartnerBrands().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'PartnerBrand',
        resourceId: new Types.ObjectId(params.id),
        before: beforePartnerBrand,
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'PartnerBrand',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}

