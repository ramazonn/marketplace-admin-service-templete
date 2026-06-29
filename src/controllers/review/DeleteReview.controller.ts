import { Context } from 'koa';
import { AnswerReviewParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, ProductEntity, ProductStatsEntity, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/review')
export default class DeleteReviewController {
  @request('delete', '/{reviewId}')
  @summary('Review delete')
  @security([])
  @tags(['Review'])
  @path({ reviewId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.reviewId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const review = await Repository.Reviews().getById(new Types.ObjectId(params.id))
      if (!review) {
        throw new NotFoundError('Review not found')
      }
      const before = await Repository.Reviews().findOneRaw(new Types.ObjectId(params.id));

      await Repository.Reviews().deleteById(new Types.ObjectId(params.id));
      console.log("++stars", review.getStars());

      if (review.getStars() > 0) {
        const product = review.getProduct() as ProductEntity
        console.log("++pro", product);


        let avgStars = 0;
        let starsCount = 0;
        let countOfReviews = 0;
        const reviews = await Repository.Reviews().list({ page: 1, size: 10000 }, { product: product.getId() });
        reviews.forEach((review) => {
          if (review.getStars() > 0) {
            avgStars += review.getStars();
            starsCount++;
          }
        });
        countOfReviews = reviews.length
        avgStars = starsCount > 0 ? avgStars / starsCount : 0;

        let productStats = product.getProductStats()
        if (!productStats) {
          productStats = new ProductStatsEntity()

        }
        productStats.buildAvgStars(avgStars);
        productStats.buildStarCounts(starsCount);
        productStats.buildCountOfReviews(countOfReviews);
        product.buildProductStats(productStats.convertToSchema());
        await Repository.Products().update(product);
      }
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Review',
        resourceId: new Types.ObjectId(params.id),
        before,
      });
      return context.send.data({ deleted: params.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Review',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
