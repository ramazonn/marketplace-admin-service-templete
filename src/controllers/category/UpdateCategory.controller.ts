import { Context } from 'koa';
import { AddCategoryParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Redis, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/category')
export default class UpdateCategoryController {
  @request('put', '/{categoryId}')
  @summary('Category update')
  @security([])
  @tags(['Category'])
  @path({ categoryId: { type: 'string', required: true } })
  @body((AddCategoryParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCategoryParams;
    let idParams: IdParams;
    try {
      params = await new AddCategoryParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.categoryId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const category = await Repository.Categories().getById(new Types.ObjectId(idParams.id));
      if (!category) {
        throw new NotFoundError('Category');
      }

      const before = await Repository.Categories().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.name) category.buildName(params.name);
      if (params.description) category.buildDescription(params.description);
      if (params.percent) category.buildPercent(params.percent);
      if (params.status) category.buildStatus(params.status);
      if (params.parent) category.buildParent(new Types.ObjectId(params.parent));
      if (params.icon) category.buildIcon(params.icon);
      if (params.how_to_select_text) category.buildHowToSelectText(params.how_to_select_text);
      if (params.how_to_select_url) category.buildHowToSelectUrl(params.how_to_select_url);
      category.buildIsPopular(params.isPopular || false);
      const updated = await Repository.Categories().update(category);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Category',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });

      const redisClient = await Redis.getInstance();
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:popular`);
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:recursive-list`);
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Category',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
