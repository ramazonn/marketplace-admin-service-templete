import { Context } from 'koa';
import { AddSpecialEventParams } from '../../infrastructure';
import {
  SpecialEventEntity, Repository, SpecialEventStatusEnum,
  ActionTypeEnum,
  ActionLogFailureReasonEnum

} from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/special-event')
export default class AddSpecialEventController {
  @request('post', '/add')
  @summary('Special Event add')
  @security([])
  @tags(['Special Event'])
  @body((AddSpecialEventParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddSpecialEventParams;
    try {
      params = await new AddSpecialEventParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const specialEvent = new SpecialEventEntity()
        .buildName(params.name)
        .buildStatus(params.status || SpecialEventStatusEnum.DRAFT)

      if (params.description) {
        specialEvent.buildDescription(params.description)
      }

      if (params.backgroundImageMobile) {
        specialEvent.buildBackgroundImageMobile(params.backgroundImageMobile)
      }
      if (params.backgroundImageWeb) {
        specialEvent.buildBackgroundImageWeb(params.backgroundImageWeb)
      }
      if (params.startAt) {
        specialEvent.buildStartAt(params.startAt)
      }
      if (params.endAt) {
        specialEvent.buildEndAt(params.endAt)
      }

      if (params.daysOfWeek) {
        specialEvent.buildDaysOfWeek(params.daysOfWeek)
      }

      if (params.eventProductLimit) {
        specialEvent.buildEventProductLimit(params.eventProductLimit)

      }

      if (params.eventLimitDuration) {
        specialEvent.buildEventLimitDuration(params.eventLimitDuration)

      }


      const created = await Repository.SpecialEvents().create(specialEvent);
      
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Special Event',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      await InvalidateRedisCache.execute('special-event:list:');
      await InvalidateRedisCache.execute('special-event:count');

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:list:`)

      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Special Event',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
} 