import { Context } from 'koa';
import { AddFAQParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/faq')
export default class UpdateFAQController {
  @request('put', '/{faqId}')
  @summary('FAQ update')
  @security([])
  @tags(['FAQ'])
  @path({ faqId: { type: 'string', required: true } })
  @body((AddFAQParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: AddFAQParams;
    let result;
    try {
      params = await new AddFAQParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.faqId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const faq = await Repository.Faqs().getById(new Types.ObjectId(idParams.id));
      if (!faq) {
        throw new NotFoundError('Faq');
      }

      const before = await Repository.Faqs().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.title) faq.buildTitle(params.title);
      if (params.description) faq.buildDescription(params.description);
      if (params.attachments) faq.buildAttachments(params.attachments);
      if (params.status) faq.buildStatus(params.status);
      if (params.type) faq.buildType(params.type);
      const updated = await Repository.Faqs().update(faq);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Faq',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Faq',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
