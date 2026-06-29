import { Context } from 'koa';

export default class GetTopSellersController {
  static async controller(context: Context): Promise<void> {
    try {
      //
      // usecase usage
      //
      return context.send.data({});
    } catch (error) {
      return context.send.error(error);
    }
  }
}
