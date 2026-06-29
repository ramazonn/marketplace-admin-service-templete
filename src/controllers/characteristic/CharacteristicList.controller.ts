import { Context } from 'koa';
import { CharacteristicListParams } from '../../infrastructure';
import { CategoryEntity, CategoryStatusEnum, CharacteristicsEntity, CharacterStatusEnum, LanguageEnum, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class CharacteristicListItemResponse {
  id: string;
  key: string;
  values: Array<string>;
  categories: Array<string>;
  status: string;
  isPin: boolean;
  constructor(item: CharacteristicsEntity, categories: Array<CategoryEntity>, lang: LanguageEnum) {
    this.id = item.getId().toString();
    this.key = item.getKey().getByLang(lang);
    this.values = item.getValues().reduce((_values: Array<string>, curr) => {
      _values.push(curr.getByLang(lang));
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
export default class CharacteristicListController {
  @request('get', '/list')
  @summary('Characteristic list')
  @security([])
  @tags(['Characteristic'])
  @query((CharacteristicListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: CharacteristicListParams;
    let result = [];
    try {
      params = await new CharacteristicListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter = { status: { $ne: CharacterStatusEnum.DELETED } };
      if (params.search) {
        filter['$or'] = [
          { 'key.uz': { $regex: params.search, $options: 'i' } },
          { 'key.ru': { $regex: params.search, $options: 'i' } },
          { 'key.en': { $regex: params.search, $options: 'i' } },
        ];
      }
      const count = await Repository.Characteristics().countDocumentsByFilter(filter);
      let characteristics;
      if (params.currentId) {
        if (params.page === 1) {
          const firstCharacteristic = await Repository.Characteristics().getById(new Types.ObjectId(params.currentId));
          if (firstCharacteristic) characteristics = [firstCharacteristic];
          const others = await Repository.Characteristics().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
          const temp = others.filter((characteristic) => !characteristic.getId().equals(new Types.ObjectId(params.currentId)));
          characteristics = [...characteristics, ...temp];
          if (characteristics.length > params.size) characteristics.pop();
        } else {
          characteristics = await Repository.Characteristics().list({ page: params.page, size: params.size + 1 }, filter, { createdAt: -1 });
          characteristics = characteristics.filter((characteristic) => !characteristic.getId().equals(new Types.ObjectId(params.currentId)));
          if (characteristics.length > params.size) {
            characteristics.pop();
          }
        }
      } else {
        characteristics = await Repository.Characteristics().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      }
      for (const item of characteristics) {
        const categories = await Repository.Categories().getCategoriesByCharacteristicId(item.getId());
        result.push(new CharacteristicListItemResponse(item, categories, context.lang));
      }
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
