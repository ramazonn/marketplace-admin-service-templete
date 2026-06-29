import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { CategoryEntity, CategoryStatusEnum, LanguageEnum, NotFoundError, Repository, TranslatesSchema } from '@ubaytools/core';
import { Types } from 'mongoose';

export class CategoryResponse {
  id: string;
  name: TranslatesSchema;
  description: string;
  icon: string;
  status: CategoryStatusEnum;
  percent: number;
  createdAt: Date;
  updatedAt: Date;
  isPopular: boolean;
  how_to_select_text: TranslatesSchema;
  how_to_select_url: string;

  constructor(category: CategoryEntity, lang: LanguageEnum) {
    this.id = category.getId().toString();
    this.name = category.getName()?.convertToSchema();
    this.description = category.getDescription();
    this.icon = category.getIcon();
    this.status = category.getStatus();
    this.percent = category.getPercent();
    this.createdAt = category.getCreatedAt();
    this.updatedAt = category.getUpdatedAt();
    this.isPopular = category.getIsPopular() || false;
    this.how_to_select_text = category.getHowToSelectText()?.convertToSchema();
    this.how_to_select_url = category.getHowToSelectUrl();
  }
}

@prefix('/category')
export default class GetCategoryByIdController {
  @request('get', '/detail/{categoryId}')
  @summary('Category get by id')
  @security([])
  @tags(['Category'])
  @path({ categoryId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.categoryId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const category = await Repository.Categories().getById(new Types.ObjectId(params.id));
      if (!category) {
        throw new NotFoundError('Category');
      }

      const response = new CategoryResponse(category, context.lang);

      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
