import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { VideoContentsEntity, Repository, LanguageEnum, TranslatesSchema } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
class VideoContentItemsResponse {
  id: string;
  videoLink: string;
  name: TranslatesSchema;
  description: TranslatesSchema;
  
  constructor(VideoContent: VideoContentsEntity, lang:LanguageEnum) {
    this.id = VideoContent.getId().toString();
    this.videoLink = VideoContent.getVideoLink();
    this.name = VideoContent.getTitle().convertToSchema();
    this.description = VideoContent.getDescription().convertToSchema();
  }
}

@prefix('/video-contents')
export default class VideoContentListController {
  @request('get', '/list')
  @summary('Video Content list')
  @security([])
  @tags(['Video Contents'])
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ListParams;
    try {
      params = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.VideoContents().countDocumentsByFilter({});
      const videoContents = await Repository.VideoContents().list({ page: params.page, size: params.size }, {}, { createdAt: -1 });
      const result = videoContents.map((videoContent) => new VideoContentItemsResponse(videoContent,context.lang));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
