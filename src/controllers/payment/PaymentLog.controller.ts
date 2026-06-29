import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Repository } from '@ubaytools/core';

@prefix('/payment')
export default class PaymentLogController {
  @request('get', '/log/list')
  @summary('Payment log list')
  @security([])
  @tags(['Payments'])
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ListParams;
    try {
      params = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.PaymentLog().countDocumentsByFilter({});
      const paymentLogs = await Repository.PaymentLog().list({ page: params.page, size: params.size }, {}, { createdAt: -1 });
      const response = paymentLogs.map((entity) => entity.convertToSchema());
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
