import { Context } from 'koa';
import { AddBrandParams, IdParams, UpdateBrandParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/brand')
export default class UpdateBrandController {
  @request('put', '/{brandId}')
  @summary('Brand update')
  @security([])
  @tags(['Brand'])
  @path({ brandId: { type: 'string', required: true } })
  @body((UpdateBrandParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: AddBrandParams;
    try {
      idParams = await new IdParams({ id: context.params.brandId }).validate();
      params = await new AddBrandParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const brand = await Repository.Brands().getById(new Types.ObjectId(idParams.id));
      if (!brand) {
        throw new NotFoundError('Brand');
      }

      const before = await Repository.Brands().findOneRaw((new Types.ObjectId(idParams.id)))
      if (params.name) brand.buildTitle(params.name);
      if (params.description) brand.buildDesc(params.description);
      if (params.avatar) brand.buildAvatar(params.avatar);
      const updateBrand = await Repository.Brands().update(brand);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Brand',
        resourceId: updateBrand.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updateBrand.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Brand',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
