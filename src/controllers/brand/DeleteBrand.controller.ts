import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/brand')
export default class DeleteBrandController {
  @request('delete', '/{brandId}')
  @summary('Brand delete')
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
      const Brand = await Repository.Brands().getById(new Types.ObjectId(params.id));
      if (!Brand) {
        throw new NotFoundError('Brand');
      }
      const before = await Repository.Brands().findOneRaw(new Types.ObjectId(params.id));
      await Repository.Brands().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Brand',
        resourceId: Brand.getId(),
        before
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Brand',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
