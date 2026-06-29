import { Context } from 'koa';
import { CategoryListParams, IdParams, ListParams } from '../../infrastructure';
import { CategoryEntity, CategoryStatusEnum, CharacterStatusEnum, LanguageEnum, ProductStatusEnum, Repository } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class CategoryListItemResponse {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: CategoryStatusEnum;
  percent: number;
  createdAt: Date;
  updatedAt: Date;
  characteristics: Array<string>;
  subCategoryCount: number;
  parent: string;
  productCount: number;
  isPopular: boolean;
  how_to_select_text: string;
  how_to_select_url: string;

  constructor(category: CategoryEntity, subCategoryCount: number, productCount: number, lang: LanguageEnum) {
    this.id = category.getId().toString();
    this.name = category.getName()?.getByLang(lang);
    this.description = category.getDescription();
    this.icon = category.getIcon() ?? null;
    this.status = category.getStatus() ?? null;
    this.percent = category.getPercent();
    this.createdAt = category.getCreatedAt();
    this.updatedAt = category.getUpdatedAt();
    this.subCategoryCount = subCategoryCount;
    this.parent = category.getParent()?.toString() || null;
    this.characteristics =
      category.getCharacteristics()?.map((item) => (item instanceof Types.ObjectId ? item.toString() : item.getId().toString())) || [];
    this.productCount = productCount;
    this.isPopular = category.getIsPopular() ?? false;
    this.how_to_select_text = category.getHowToSelectText()?.getByLang(lang);
    this.how_to_select_url = category.getHowToSelectUrl();
  }
}

@prefix('/category')
export default class CategoryListController {
  @request('get', '/list')
  @summary('Category list')
  @security([])
  @tags(['Category'])
  @query((CategoryListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: CategoryListParams;
    try {
      params = await new CategoryListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = { status: { $ne: CategoryStatusEnum.DELETED } };
      filter.parent = params.parent || { $exists: false };

      if (params.status) filter.status = params.status as CategoryStatusEnum;

      if (params.search) {
        filter['$or'] = [
          { 'name.uz': { $regex: params.search, $options: 'i' } },
          { 'name.ru': { $regex: params.search, $options: 'i' } },
          { 'name.en': { $regex: params.search, $options: 'i' } },
        ];
      }

      const count = await Repository.Categories().countDocumentsByFilter(filter);
      let categories;
      if (params.currentId) {
        if (params.page === 1) {
          const firstCategory = await Repository.Categories().getById(new Types.ObjectId(params.currentId));
          if (firstCategory) categories = [firstCategory];
          const others = await Repository.Categories().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
          const temp = others.filter((category) => !category.getId().equals(new Types.ObjectId(params.currentId)));
          categories = [...categories, ...temp];
          if (categories.length > params.size) categories.pop();
        } else {
          categories = await Repository.Categories().list({ page: params.page, size: params.size + 1 }, filter, { createdAt: -1 });
          categories = categories.filter((category) => !category.getId().equals(new Types.ObjectId(params.currentId)));
          if (categories.length > params.size) {
            categories.pop();
          }
        }
      } else {
        categories = await Repository.Categories().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      }

      const response = await Promise.all(
        categories.map(async (category) => {
          const subCategoryCount = await Repository.Categories().countDocumentsByFilter({ parent: category.getId(), status: { $ne:CategoryStatusEnum.DELETED } });
          const totalProductCount = await CategoryListController.getTotalProductCount(category.getId());
          return new CategoryListItemResponse(category, subCategoryCount, totalProductCount, context.lang);
        }),
      );
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }

  private static async getTotalProductCount(categoryId: Types.ObjectId): Promise<number> {
    const directProductCount = await Repository.Products().countDocumentsByFilter({
      category: categoryId,
      status: { $ne: ProductStatusEnum.DELETED},
    });

    const subCategories = await Repository.Categories().list(
      { page: 1, size: 1000 },
      { parent: categoryId, status: { $ne: CategoryStatusEnum.DELETED } },
    );

    const subCategoryProductCounts = await Promise.all(
      subCategories.map((subCategory) => CategoryListController.getTotalProductCount(subCategory.getId())),
    );

    const totalSubCategoryProductCount = subCategoryProductCounts.reduce((sum, count) => sum + count, 0);

    return directProductCount + totalSubCategoryProductCount;
  }
}
