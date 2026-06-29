import { Context } from 'koa';
import { AddModelParams, IdParams } from '../../infrastructure';
import { NotFoundError, Repository, CategoryStatusEnum, ModelsEntity, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/model')
export default class AddModelController {
  @request('post', '/add')
  @summary('Model add')
  @security([])
  @tags(['Model'])
  @body((AddModelParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddModelParams;
    try {
      params = await new AddModelParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const model = new ModelsEntity().buildTitle(params.name).buildDesc(params.description).buildAvatar(params.avatar);
      const createdModel = await Repository.Models().create(model);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Model',
        resourceId: createdModel.getId(),
        after: createdModel.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: createdModel.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Model',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
