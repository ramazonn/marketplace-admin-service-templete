import { Context } from 'koa';
import { AddBannerToPromotionParams, IdParams, UpdateBannerToPromotionParams, UpdateSellerParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/promotion')
export default class UpdatePromotionController {
  @request('put', '/{promotionId}')
  @summary('Promotion update')
  @security([])
  @tags(['Promotion'])
  @path({ promotionId: { type: 'string', required: true } })
  @body((UpdateBannerToPromotionParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: AddBannerToPromotionParams;
    try {
      idParams = await new IdParams({ id: context.params.promotionId }).validate();
      params = await new AddBannerToPromotionParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const found = await Repository.Promotions().getById(new Types.ObjectId(idParams.id));
      const before = await Repository.Promotions().findOneRaw(new Types.ObjectId(idParams.id));
      if (params.attachment) found.buildAttachment(params.attachment);
      if (params.startDate) found.buildStartDate(params.startDate);
      if (params.endDate) found.buildEndDate(params.endDate);
      if (params.link) found.buildLink(params.link);
      if (params.type) found.buildType(params.type);
      if (params.page) found.buildPage(params.page);
      if (params.screen) found.buildScreen(params.screen);
      if (params.screenId) found.buildScreenId(params.screenId);
      
      const after = await Repository.Promotions().update(found);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Promocode',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });

      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Promotion',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
