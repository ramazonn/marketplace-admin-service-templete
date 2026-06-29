import { Context } from 'koa';
import { ActionLogFailureReasonEnum, ActionTypeEnum, Repository, VideoContentsEntity } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { AddLifehackParams, AddVideoContentParams } from '../../infrastructure';
import { ActionLogService } from '../../services';

@prefix('/video-contents')
export default class AddVideoContentController {
  @request('post', '/add')
  @summary('VideoContent add')
  @security([])
  @tags(['Video Contents'])
  @body((AddVideoContentParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddVideoContentParams;
    try {
      params = await new AddVideoContentParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const videoContent = new VideoContentsEntity().buildVideoLink(params.videoLink).buildTitle(params.title).buildDescription(params.description)
      const createdVideoContent = await Repository.VideoContents().create(videoContent);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Video Contents',
        resourceId: createdVideoContent.getId(),
        after: createdVideoContent.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: createdVideoContent.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Video Contents',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
