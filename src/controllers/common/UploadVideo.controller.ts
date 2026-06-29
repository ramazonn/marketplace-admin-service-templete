import { formData, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { CloudFlareService } from '@ubaytools/core';

@prefix('/common')
export default class UploadVideoController {
  @request('post', '/upload-video')
  @summary('Upload video (mp4) to R2 CloudFlare')
  @security([])
  @tags(['Common'])
  @formData({ file: { type: 'file', required: true, description: 'video file content(.mp4)' } })
  static async controller(context: Context): Promise<void> {
    try {
      const cloudFlareService = new CloudFlareService();
      const result = await cloudFlareService.uploadVideo(context.file);
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
