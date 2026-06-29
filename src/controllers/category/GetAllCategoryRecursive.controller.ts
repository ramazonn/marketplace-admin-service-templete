import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { CategoryEntity, CategoryStatusEnum, LanguageEnum, Repository } from '@ubaytools/core';
import { CategoryListItemResponse } from './CategoryList.controller';

export class CategoryRecursiveItemResponse extends CategoryListItemResponse {
  subCategories: Array<CategoryRecursiveItemResponse> | null = null;
  constructor(category: CategoryEntity, lang: LanguageEnum) {
    super(category, 0, 0, lang);
  }

  setSubCategories(categories: Array<CategoryRecursiveItemResponse>) {
    this.subCategoryCount = categories.length;
    this.subCategories = categories;
  }
}

@prefix('/category')
export default class GetAllCategoryRecursiveController {
  @request('get', '/recursive-list')
  @summary('Get all categories and sub-categories')
  @security([])
  @tags(['Category'])
  static async controller(context: Context): Promise<void> {
    try {
      const items = await Repository.Categories().list({ page: 1, size: 1000 }, { status: CategoryStatusEnum.ACTIVE });
      const result = await GetAllCategoryRecursiveController.dfs(context, null, items);
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }

  static async dfs(context: Context, parent: string | null, items: Array<CategoryEntity>): Promise<Array<CategoryRecursiveItemResponse>> {
    const tempItems = items.filter((item) => {
      return parent ? item.getParent()?.toString() === parent : !item.getParent();
    });
    const result = tempItems.map((item) => new CategoryRecursiveItemResponse(item, context.lang));
    for (const resultItem of result) {
      const subCategories = await GetAllCategoryRecursiveController.dfs(context, resultItem.id, items);
      resultItem.setSubCategories(subCategories);
    }
    return result;
  }
}
