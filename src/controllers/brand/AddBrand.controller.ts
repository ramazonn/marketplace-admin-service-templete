import { Context } from 'koa';
import { AddBrandParams } from '../../infrastructure';
import { Repository, BrandsEntity, ActionLogFailureReasonEnum, ActionTypeEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { create } from 'domain';
import { ActionLogService } from '../../services';

@prefix('/brand')
export default class AddBrandController {
  @request('post', '/add')
  @summary('Brand add')
  @security([])
  @tags(['Brand'])
  @body((AddBrandParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddBrandParams;
    try {
      params = await new AddBrandParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const brand = new BrandsEntity().buildTitle(params.name).buildDesc(params.description).buildAvatar(params.avatar);
      const createdBrand = await Repository.Brands().create(brand);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Brand',
        resourceId: createdBrand.getId(),
        after: createdBrand.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: createdBrand.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Brand',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
