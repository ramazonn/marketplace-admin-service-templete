import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, CategoryStatusEnum, Redis, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/category')
export default class DeleteCategoryController {
  @request('delete', '/{categoryId}')
  @summary('Category delete')
  @security([])
  @tags(['Category'])
  @path({ categoryId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.categoryId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const category = await Repository.Categories().getById(new Types.ObjectId(params.id));
      if (!category) {
        throw new NotFoundError('Category');
      }

      const before = await Repository.Categories().findOneRaw(new Types.ObjectId(params.id));

      category.buildStatus(CategoryStatusEnum.DELETED);
      await Repository.Categories().update(category);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Category',
        resourceId: category.getId(),
        before
      });
      const redisClient = await Redis.getInstance();
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:popular`);
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:recursive-list`);
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Category',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
