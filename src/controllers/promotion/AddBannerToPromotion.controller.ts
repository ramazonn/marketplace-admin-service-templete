import { Context } from 'koa';
import { AddBannerToPromotionParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, PromotionsEntity, Repository } from '@ubaytools/core';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/promotion')
export default class AddBannerToPromotionController {
  @request('post', '/add-banner')
  @summary('Add banner to promotion')
  @security([])
  @tags(['Promotion'])
  @body((AddBannerToPromotionParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddBannerToPromotionParams;
    try {
      params = await new AddBannerToPromotionParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const item = new PromotionsEntity();
      item
        .buildAttachment(params.attachment)
        .buildType(params.type)
        .buildStartDate(params.startDate)
        .buildEndDate(params.endDate)
        .buildLink(params.link)
        .buildPage(params.page);

      if (params.screen) {
        item.buildScreen(params.screen);
      }
      if (params.screenId) {
        item.buildScreenId(params.screenId);
      }

      const created = await Repository.Promotions().create(item);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Promotion',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ created: true, id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Promotion',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
