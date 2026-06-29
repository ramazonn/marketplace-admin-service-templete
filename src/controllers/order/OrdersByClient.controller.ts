import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

export default class OrdersByClientController {
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      //
      // usecase usage
      //
      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
