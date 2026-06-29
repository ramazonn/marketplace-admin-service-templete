import { Context } from 'koa';
import { IdParams, UpdateVideoContentParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/video-contents')
export default class UpdateVideoContentController {
  @request('put', '/{videoContentId}')
  @summary('Video Content update')
  @security([])
  @tags(['Video Contents'])
  @path({ videoContentId: { type: 'string', required: true } })
  @body((UpdateVideoContentParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateVideoContentParams;
    try {
      console.log(context.params.videoContentId);

      idParams = await new IdParams({ id: context.params.videoContentId }).validate();
      params = await new UpdateVideoContentParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const videoContent = await Repository.VideoContents().getById(new Types.ObjectId(idParams.id));
      if (!videoContent) {
        throw new NotFoundError('Video Content');
      }
      const before = await Repository.VideoContents().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.videoLink) videoContent.buildVideoLink(params.videoLink);
      if (params.title) videoContent.buildTitle(params.title);
      if (params.description) videoContent.buildDescription(params.description);
      const after = await Repository.VideoContents().update(videoContent);
      console.log(videoContent);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Video Content',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Video Content',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
