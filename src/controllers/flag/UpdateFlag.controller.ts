import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { IdParams, UpdateFlagParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/flag')
export default class UpdateFlagController {
  @request('put', '/{flagId}')
  @summary('Flag update')
  @security([])
  @tags(['Flag'])
  @body((UpdateFlagParams as any).swaggerDocument)
  @path({ flagId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: UpdateFlagParams;
    let idParams: IdParams;
    try {
      params = await new UpdateFlagParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.flagId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const found = await Repository.Flags().getById(new Types.ObjectId(idParams.id));
      if (!found) {
        throw new NotFoundError('Flag');
      }
      const before = await Repository.Flags().findOneRaw(new Types.ObjectId(idParams.id))
      if (params.name) found.buildName(params.name);
      if (params.color) found.buildColor(params.color);
      const updated = await Repository.Flags().update(found);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Flag',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Flag',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
