import { Context } from 'koa';
import { AddCarouselParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, CarouselEntity, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/carousel')
export default class AddCarouselController {
  @request('post', '/add')
  @summary('Carousel add')
  @security([])
  @tags(['Carousel'])
  @body((AddCarouselParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCarouselParams;
    try {
      params = await new AddCarouselParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const carousel = new CarouselEntity().buildTitle(params.title).buildStatus(params.status);
      const created = await Repository.Carousels().create(carousel);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Carusel',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`);  
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:count:`);  
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Carusel',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
