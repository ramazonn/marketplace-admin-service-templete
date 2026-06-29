import { Context } from 'koa';
import { AddFAQParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, FaqEntity, FaqStatusEnum, FaqTypeEnum, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/faq')
export default class AddFAQController {
  @request('post', '/add')
  @summary('FAQ add')
  @security([])
  @tags(['FAQ'])
  @body((AddFAQParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddFAQParams;
    try {
      params = await new AddFAQParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const faq = new FaqEntity()
        .buildTitle(params.title)
        .buildDescription(params.description)
        .buildAttachments(params.attachments)
        .buildStatus(params.status || FaqStatusEnum.ACTIVE)
        .buildType(params.type || FaqTypeEnum.DEFAULT);
      const created = await Repository.Faqs().create(faq);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Faq',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Faq',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
