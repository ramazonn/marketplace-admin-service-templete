import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/flag')
export default class DeleteFlagController {
  @request('delete', '/{flagId}')
  @summary('Flag add')
  @security([])
  @tags(['Flag'])
  @path({ flagId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.flagId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const beforeFlag = await Repository.Flags().findOneRaw(new Types.ObjectId(params.id))
      if(!beforeFlag){
        throw new NotFoundError('Flag')
      }
      await Repository.Flags().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Flag',
        resourceId: new Types.ObjectId(params.id),
        before: beforeFlag
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Flag',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
