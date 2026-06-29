import { Context } from 'koa';
import { AnswerReviewParams, IdParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';

@prefix('/review')
export default class AnswerToReviewController {
  @request('post', '/answer/{reviewId}')
  @summary('Answer to review')
  @security([])
  @tags(['Review'])
  @body((AnswerReviewParams as any).swaggerDocument)
  @path({ reviewId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: AnswerReviewParams;
    let idParams: IdParams;
    try {
      params = await new AnswerReviewParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.reviewId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const review = await Repository.Reviews().getById(new Types.ObjectId(idParams.id));
      if (!review) {
        throw new NotFoundError('Review');
      }
      
      // Get the user who wrote the review
      const userId = review.getUser();
      if (!userId) {
        throw new NotFoundError('Review user not found');
      }

      // Update the review with the answer
      review.buildAnswer(params.answer);
      await Repository.Reviews().update(review);

      // Send notification to the user about the review response
      try {
        const notificationService = new NotificationTemplateService();
        await notificationService.sendReviewResponseNotification(
          userId.toString(),
          review.getId().toString(),
          params.answer
        );
      } catch (notificationError) {
        console.error('Failed to send review response notification:', notificationError);
      }

      return context.send.data({ updated: idParams.id });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
