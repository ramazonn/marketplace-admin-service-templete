import { Context } from 'koa';
import { AddCarouselParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { lang } from 'moment';
import { ActionLogService } from '../../services';

@prefix('/carousel')
export default class UpdateCarouselController {
  @request('put', '/{carouselId}')
  @summary('Carousel update')
  @security([])
  @tags(['Carousel'])
  @path({ carouselId: { type: 'string', required: true } })
  @body((AddCarouselParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCarouselParams;
    let idParams: IdParams;
    try {
      params = await new AddCarouselParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.carouselId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const carousel = await Repository.Carousels().getById(new Types.ObjectId(idParams.id));
      if (!carousel) {
        throw new NotFoundError('Carousel');
      }

      const before = await Repository.Carousels().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.title) carousel.buildTitle(params.title);
      if (params.status) carousel.buildStatus(params.status);
     const updated = await Repository.Carousels().update(carousel);

        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:${carousel.getId().toString()}:`);  
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`);  

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Carousel',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Carousel',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
