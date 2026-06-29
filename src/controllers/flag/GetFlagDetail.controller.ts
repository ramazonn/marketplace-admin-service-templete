import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { FlagEntity, LanguageEnum, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { Types } from 'mongoose';

export class FlagDetailResponse {
  id: string;
  name: TranslatesSchema | string;
  color: string;
  constructor(flag: FlagEntity, lang: LanguageEnum) {
    this.id = flag.getId().toString();
    this.name = flag.getName().convertToSchema();
    this.color = flag.getColor();
  }
}
@prefix('/flag')
export default class GetFlagDetailController {
  @request('get', '/detail/{flagId}')
  @summary('Flag add')
  @security([])
  @tags(['Flag'])
  @path({ flagId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.flagId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const flag = await Repository.Flags().getById(new Types.ObjectId(params.id));
      if (!flag) {
        throw new NotFoundError('Flag');
      }
      const response = new FlagDetailResponse(flag, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
