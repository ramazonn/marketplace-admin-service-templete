import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import {
  CategoryEntity,
  CategoryStatusEnum,
  CharacteristicsEntity,
  CharacterStatusEnum,
  LanguageEnum,
  NotFoundError,
  Repository,
  TranslatesSchema,
} from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { CharacteristicListItemResponse } from './CharacteristicList.controller';

export class CharacteristicResponse {
  id: string;
  key: TranslatesSchema;
  values: Array<TranslatesSchema>;
  categories: Array<string>;
  status: string;
  isPin: boolean;
  constructor(item: CharacteristicsEntity, categories: Array<CategoryEntity>, lang: LanguageEnum) {
    this.id = item.getId().toString();
    this.key = item.getKey()?.convertToSchema();
    this.values = item.getValues().reduce((_values: Array<TranslatesSchema>, curr) => {
      _values.push(curr.convertToSchema());
      return _values;
    }, []);
    this.status = item.getStatus();
    this.isPin = item.getIsPin();
    this.categories = categories
      .filter((category) => category.getStatus() == CategoryStatusEnum.ACTIVE)
      .map((category) => category.getName().getByLang(lang));
  }
}

@prefix('/characteristic')
export default class GetCharacteristicDetailController {
  @request('get', '/detail/{characteristicId}')
  @summary('Characteristic get by id')
  @security([])
  @tags(['Characteristic'])
  @path({ characteristicId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.characteristicId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const item = await Repository.Characteristics().getById(new Types.ObjectId(params.id));
      if (!item) {
        throw new NotFoundError('Characteristic');
      }
      const categories = await Repository.Categories().getCategoriesByCharacteristicId(item.getId());
      const response = new CharacteristicResponse(item, categories, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
