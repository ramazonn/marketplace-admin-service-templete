import { Context } from 'koa';
import { IdParams, AddLifehackParams, UpdateLifehackParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/lifehacks')
export default class UpdateLifehackController {
  @request('put', '/{lifehackId}')
  @summary('Lifehack update')
  @security([])
  @tags(['Lifehacks'])
  @path({ lifehackId: { type: 'string', required: true } })
  @body((UpdateLifehackParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: AddLifehackParams;
    try {
      console.log(context.params.lifehackId);

      idParams = await new IdParams({ id: context.params.lifehackId }).validate();
      params = await new AddLifehackParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const lifehack = await Repository.Lifehacks().getById(new Types.ObjectId(idParams.id));
      if (!lifehack) {
        throw new NotFoundError('Lifehack');
      }
      if (params.videoLink) {
        lifehack.buildVideoLink(params.videoLink);
      }

      if (params.product) {
        lifehack.buildProduct(new Types.ObjectId(params.product));
      }
      await Repository.Lifehacks().update(lifehack);
      console.log(lifehack);
      const before = await Repository.Lifehacks().findOneRaw(new Types.ObjectId(idParams.id));
      if (params.videoLink) lifehack.buildVideoLink(params.videoLink);
      const updated = await Repository.Lifehacks().update(lifehack);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Lifehack',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });

      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Lifehack',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
