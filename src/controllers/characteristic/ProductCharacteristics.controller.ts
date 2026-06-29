import { Context } from 'koa';
import { ProductCharacteristicsParams } from '../../infrastructure';
import { CategoryEntity, CategoryStatusEnum, CharacteristicsEntity, CharacterStatusEnum, LanguageEnum, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class ProductCharacteristicItemResponse {
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
export default class ProductCharacteristicsController {
  @request('post', '/product-characteristics')
  @summary('Product characteristics for selection')
  @security([])
  @tags(['Characteristic'])
  @body((ProductCharacteristicsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ProductCharacteristicsParams;
    let result = [];
    try {
      params = await new ProductCharacteristicsParams(context.request.body).validate();
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
      let characteristics = [];

      if (params.currentIds && params.currentIds.length > 0) {
        if (params.page === 1) {
          // First page: get current characteristics first, then fill with others
          const currentCharacteristics = await Promise.all(
            params.currentIds.map(id => Repository.Characteristics().getById(new Types.ObjectId(id)))
          );
          
          // Filter out null values (in case some IDs don't exist)
          const validCurrentCharacteristics = currentCharacteristics.filter(char => char !== null);
          
          // Get other characteristics excluding current ones
          const currentIdsObjectIds = params.currentIds.map(id => new Types.ObjectId(id));
          const otherFilter = { 
            ...filter, 
            _id: { $nin: currentIdsObjectIds } 
          };
          
          const otherCharacteristics = await Repository.Characteristics().list(
            { page: 1, size: params.size - validCurrentCharacteristics.length }, 
            otherFilter, 
            { createdAt: -1 }
          );
          
          characteristics = [...validCurrentCharacteristics, ...otherCharacteristics];
        } else {
          // Other pages: exclude current characteristics completely
          const currentIdsObjectIds = params.currentIds.map(id => new Types.ObjectId(id));
          const otherFilter = { 
            ...filter, 
            _id: { $nin: currentIdsObjectIds } 
          };
          
          // Get all remaining characteristics and manually paginate
          const allOtherCharacteristics = await Repository.Characteristics().list(
            { page: 1, size: 1000 }, // Get all to manually paginate
            otherFilter, 
            { createdAt: -1 }
          );
          
          // Calculate pagination manually
          // First page had currentIds.length items, so we need to skip those
          const currentIdsCount = params.currentIds.length;
          const itemsPerPage = params.size;
          
          // Calculate how many items were shown on first page from remaining characteristics
          const firstPageRemainingItems = itemsPerPage - currentIdsCount;
          
          // Calculate start index for current page
          // For page 2: skip firstPageRemainingItems items from first page
          // For page 3: skip firstPageRemainingItems + itemsPerPage items
          // For page 4: skip firstPageRemainingItems + itemsPerPage * 2 items
          const skipItems = firstPageRemainingItems + (itemsPerPage * (params.page - 2));
          const startIndex = skipItems;
          const endIndex = startIndex + itemsPerPage;
          
          characteristics = allOtherCharacteristics.slice(startIndex, endIndex);
        }
      } else {
        // No current IDs provided, return normal pagination
        characteristics = await Repository.Characteristics().list(
          { page: params.page, size: params.size }, 
          filter, 
          { createdAt: -1 }
        );
      }

      // Get categories for each characteristic
      for (const item of characteristics) {
        const categories = await Repository.Categories().getCategoriesByCharacteristicId(item.getId());
        result.push(new ProductCharacteristicItemResponse(item, categories, context.lang));
      }

      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
} 