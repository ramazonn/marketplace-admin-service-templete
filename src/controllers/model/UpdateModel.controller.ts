import { Context } from 'koa';
import { AddModelParams, IdParams, UpdateModelParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/model')
export default class UpdateModelController {
  @request('put', '/{modelId}')
  @summary('Model update')
  @security([])
  @tags(['Model'])
  @path({ modelId: { type: 'string', required: true } })
  @body((UpdateModelParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateModelParams;
    try {
      idParams = await new IdParams({ id: context.params.modelId }).validate();
      params = await new UpdateModelParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const model = await Repository.Models().getById(new Types.ObjectId(idParams.id));
      if (!model) {
        throw new NotFoundError('Model');
      }
      const before = await Repository.Models().findOneRaw(new Types.ObjectId(idParams.id));
      if (params.name) model.buildTitle(params.name);
      if (params.description) model.buildDesc(params.description);
      if (params.avatar) model.buildAvatar(params.avatar);
      const updated = await Repository.Models().update(model);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Model',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Model',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
