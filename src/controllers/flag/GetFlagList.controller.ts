import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { FlagEntity, LanguageEnum, Repository } from '@ubaytools/core';
import { FlagDetailResponse } from './GetFlagDetail.controller';

class FlagListItemResponse extends FlagDetailResponse {
  constructor(flag: FlagEntity, lang: LanguageEnum) {
    super(flag, lang);
    this.name = flag.getName().getByLang(lang);
  }
}

@prefix('/flag')
export default class GetFlagListController {
  @request('get', '/list')
  @summary('Flag list')
  @security([])
  @tags(['Flag'])
  static async controller(context: Context): Promise<void> {
    try {
      const total = await Repository.Flags().countDocumentsByFilter({});
      const items = await Repository.Flags().list({ page: 1, size: 100 });
      const response = items.map((item) => new FlagListItemResponse(item, context.lang));
      return context.send.data({ total: total, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
