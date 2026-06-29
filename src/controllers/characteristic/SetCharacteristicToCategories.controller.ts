import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { AddCharacteristicToCategoryParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/characteristic')
export default class SetCharacteristicToCategoriesController {
  @request('put', '/set-to-category/{characteristicId}')
  @summary('Set characteristic to category')
  @security([])
  @tags(['Characteristic'])
  @path({ characteristicId: { type: 'string', required: true } })
  @body((AddCharacteristicToCategoryParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: AddCharacteristicToCategoryParams;
    try {
      idParams = await new IdParams({ id: context.params.characteristicId }).validate();
      params = await new AddCharacteristicToCategoryParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const charId = new Types.ObjectId(idParams.id);
      const newCategoryIds = params.categoryIds.map((id: string) => new Types.ObjectId(id));
      const categories = await Repository.Categories().getCategoriesByCharacteristicId(charId);
      // categories to remove
      const categoriesToRemove = categories.filter(
        (cat) => !newCategoryIds.some((id) => id.equals(cat.getId()))
      );

      // categories to add
      const categoriesToAdd = newCategoryIds.filter(
        (id) => !categories.some((cat) => cat.getId().equals(id))
      );

      // remove characteristic
      for (const category of categoriesToRemove) {
        const items = category.getCharacteristics().filter(
          (item) => item.toString() !== idParams.id
        );
       
        const normalizedItems = items.map((item) =>
          item instanceof Types.ObjectId ? item : item.convertToSchema()
        );
      
        category.buildCharacteristics(normalizedItems);
        await Repository.Categories().update(category);
      }

       // add characteristic
       for (const categoryId of categoriesToAdd) {
        const category = await Repository.Categories().getById(categoryId);
        if (!category) {
          throw new NotFoundError('Category');
        }
        const items = category.getCharacteristics();
        if (!items.find((x) => x.toString() === idParams.id)) {
          items.push(charId);
        }
        const normalizedItems = items.map((item) =>
          item instanceof Types.ObjectId ? item : item.convertToSchema()
        );
      
        category.buildCharacteristics(normalizedItems);
        await Repository.Categories().update(category);
      }
      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
