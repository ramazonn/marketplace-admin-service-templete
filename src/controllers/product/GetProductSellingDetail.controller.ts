import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { Repository } from '@ubaytools/core';
import { Types } from 'mongoose';

export default class GetProductSellingDetailController {
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.productId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const product = await Repository.Products().getById(new Types.ObjectId(params.id));
      // TODO create Selling Detail Response
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
