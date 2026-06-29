import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/carousel')
export default class DeleteCarouselController {
  @request('delete', '/{carouselId}')
  @summary('Carousel delete')
  @security([])
  @tags(['Carousel'])
  @path({ carouselId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.carouselId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const carousel = await Repository.Carousels().getById(new Types.ObjectId(params.id));
      if (!carousel) {
        throw new NotFoundError('BroadcastNotification');
      }
      const before = await Repository.Carousels().findOneRaw(new Types.ObjectId(params.id));

      await Repository.Carousels().deleteById(new Types.ObjectId(params.id));
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:${params.id}:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:count:`);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Carusel',
        resourceId: carousel.getId(),
        before
      });

      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Carusel',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
