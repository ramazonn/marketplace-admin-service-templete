import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, Repository, NotFoundError, } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/lifehacks')
export default class DeleteLifehackController {
  @request('delete', '/{lifehackId}')
  @summary('Lifehack delete')
  @security([])
  @tags(['Lifehacks'])
  @path({ lifehackId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;

    try {
      params = await new IdParams({ id: context.params.lifehackId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const lifehackId = new Types.ObjectId(params.id);

      const foundLifehack = await Repository.Lifehacks().getById(lifehackId);
      if (!foundLifehack) {
        throw new NotFoundError('Lifehack');
      }

      await Repository.LifehackComments().deleteManyByFilter({
        lifehack: lifehackId,
      });

      await Repository.LifehackLikes().deleteManyByFilter({
        lifehack: lifehackId,
      });

      await Repository.Lifehacks().deleteById(lifehackId);

      const beforeLifehack = await Repository.Lifehacks().findOneRaw(new Types.ObjectId(params.id));
      await Repository.Lifehacks().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Lifehack',
        resourceId: new Types.ObjectId(params.id),
        before: beforeLifehack
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Lifehack',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}