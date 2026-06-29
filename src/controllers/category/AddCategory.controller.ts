import { Context } from 'koa';
import { AddCategoryParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, CategoryEntity, Redis, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/category')
export default class AddCategoryController {
  @request('post', '/add')
  @summary('Category add')
  @security([])
  @tags(['Category'])
  @body((AddCategoryParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCategoryParams;
    try {
      params = await new AddCategoryParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const category = new CategoryEntity()
        .buildName(params.name)
        .buildDescription(params.description)
        .buildPercent(params.percent)
        .buildStatus(params.status)
        .buildIcon(params.icon)
        .buildIsPopular(params.isPopular || false)
        .buildHowToSelectText(params.how_to_select_text)
        .buildHowToSelectUrl(params.how_to_select_url);
      if (params.parent) category.buildParent(new Types.ObjectId(params.parent));
      const created = await Repository.Categories().create(category);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Category',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      
      const redisClient = await Redis.getInstance();
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:popular`);
      await redisClient.deleteKeysByPattern(`${process.env.NODE_ENV}:category:recursive-list`);
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Category',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
