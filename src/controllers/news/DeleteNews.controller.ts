import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/news')
export default class DeleteNewsController {
  @request('delete', '/{newsId}')
  @summary('News delete')
  @security([])
  @tags(['News'])
  @path({ newsId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.newsId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const News = await Repository.News().getById(new Types.ObjectId(params.id));
      if (!News) {
        throw new NotFoundError('News');
      }
      const before = await Repository.News().findOneRaw(new Types.ObjectId(params.id))

      await Repository.News().deleteById(new Types.ObjectId(params.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'News',
        resourceId: News.getId(),
        before
      });

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:list:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:news:count`);

      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'News',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
