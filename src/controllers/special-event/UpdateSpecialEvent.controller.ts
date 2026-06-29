import { Context } from 'koa';
import { IdParams, UpdateSpecialEventParams } from '../../infrastructure';
import { SpecialEventEntity, Repository, NotFoundError, ProductEntity, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/special-event')
export default class UpdateSpecialEventController {
  @request('put', '/{specialEventId}')
  @summary('Update Special Event')
  @security([])
  @tags(['Special Event'])
  @path({ specialEventId: { type: 'string', required: true } })
  @body((UpdateSpecialEventParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateSpecialEventParams;
    let idParams: IdParams;
    try {
        params = await new UpdateSpecialEventParams(context.request.body).validate();
        idParams = await new IdParams({ id: context.params.specialEventId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    
    try {
      const specialEvent = await Repository.SpecialEvents().getById(new Types.ObjectId(idParams.id));
      if (!specialEvent) {
        throw new NotFoundError('Special event');
      }
      const before = await Repository.SpecialEvents().findOneRaw(new Types.ObjectId(idParams.id));

          if(params.name) {
            specialEvent.buildName(params.name);
          }
          if(params.description) {
            specialEvent.buildDescription(params.description);
          }
          if(params.status) {
            specialEvent.buildStatus(params.status);

          }
          if(params.backgroundImageMobile) {
            specialEvent.buildBackgroundImageMobile(params.backgroundImageMobile);
          }
          if(params.backgroundImageWeb) {
            specialEvent.buildBackgroundImageWeb(params.backgroundImageWeb);
          }
          if(params.startAt !== undefined) {
            specialEvent.buildStartAt(params.startAt);
          }
          if(params.endAt !== undefined) {
            specialEvent.buildEndAt(params.endAt);
          }
          if (params.daysOfWeek) {
            specialEvent.buildDaysOfWeek(params.daysOfWeek);
          }
          if(params.eventProductLimit !== undefined) {
            specialEvent.buildEventProductLimit(params.eventProductLimit);
      }
      
      if (params.eventLimitDuration !== undefined) {
        specialEvent.buildEventLimitDuration(params.eventLimitDuration);
      }

      await Repository.SpecialEvents().update(specialEvent);

      const after = await Repository.SpecialEvents().findOneRaw(new Types.ObjectId(idParams.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Special event',
        resourceId: new Types.ObjectId(idParams.id),
        before: before as unknown as Record<string, unknown>,
        after: after as unknown as Record<string, unknown>
      });

      if (params.status) {
        for(const specialEventProduct of specialEvent.getProducts()) {
          // await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:${specialEventProduct.getProduct().toString()}:`);
          // await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`); 
          console.log("specialEventProduct",(specialEventProduct.getProduct()as ProductEntity).getId().toString(),`${process.env.NODE_ENV}:product:detail:${(specialEventProduct.getProduct()as ProductEntity).getId().toString()}:`);
          await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${(specialEventProduct.getProduct()as ProductEntity).getId().toString()}:`);  
          await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${(specialEventProduct.getProduct()as ProductEntity).getId().toString()}:`); 
        }
      }

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}special-events:friday:uz:active`);
      
      await InvalidateRedisCache.execute('special-event:list:');  
      await InvalidateRedisCache.execute('special-event:count');
      
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:list:`)
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:${idParams.id}:`);

      console.log(await InvalidateRedisCache.execute(`${process.env.NODE_ENV}special-events:friday:uz:active`));
      
      return context.send.data({ updated: true });
    } catch (error) {
      
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Special event',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
} 