import { Types } from 'mongoose';
import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import {  VideoContentsEntity, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class VideoContentsDetailResponse {
  id: string;
  videoLink: string;
  name: TranslatesSchema;
  description: TranslatesSchema;
  constructor(videoContent: VideoContentsEntity) {
    this.id = videoContent.getId().toString();
    this.videoLink = videoContent.getVideoLink();
    this.name = videoContent.getTitle()?.convertToSchema();
    this.description = videoContent.getDescription()?.convertToSchema();
  }
}

@prefix('/video-contents')
export default class videoContentDetailController {
  @request('get', '/detail/{videoContentId}')
  @summary('Video contents detail')
  @security([])
  @tags(['Video Contents'])
  @path({ videoContentId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.videoContentId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const foundVideoContent = await Repository.VideoContents().getById(new Types.ObjectId(params.id));
      if (!foundVideoContent) {
        throw new NotFoundError('Video Content by id');
      }
      const response = new VideoContentsDetailResponse(foundVideoContent);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
