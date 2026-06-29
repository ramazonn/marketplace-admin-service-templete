import { Context } from 'koa';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, SpecialEventEntity } from '@ubaytools/core';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { IdParams } from '../../infrastructure';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/special-event')
export default class DeleteSpecialEventController {
  @request('delete', '/{specialEventId}')
  @summary('Delete Special Event')
  @security([])
  @tags(['Special Event'])
  @path({ specialEventId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.specialEventId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const beforeSpecialEvent = await Repository.SpecialEvents().findOneRaw(new Types.ObjectId(params.id));

      if (!beforeSpecialEvent) {
        throw new NotFoundError('Special Event');
      }

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Special Event',
        resourceId: new Types.ObjectId(params.id),
        before: beforeSpecialEvent,
      });

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:list:`)
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:${params.id}:`);

      await Repository.SpecialEvents().deleteById(new Types.ObjectId(params.id));
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Special Event',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
} 