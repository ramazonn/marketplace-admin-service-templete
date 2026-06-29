import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Repository } from '@ubaytools/core';
import { Types } from 'mongoose';

@prefix('/orders')
export default class RetryFailedJobController {
  @request('post', '/retry-failed-job/{orderId}')
  @summary('Retry Failed Job')
  @security([])
  @tags(['Orders'])
  @path({ orderId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    const orderId = context.params.orderId;
    try {
      const order = await Repository.Orders().getById(new Types.ObjectId(orderId));
      if (!order) {
        throw new Error('Order not found');
      }
      const jobId = order.getSapOrderInfo()?.jobId;
      // const orderQueue = OrderQueueService.getInstance();
      // const result = await orderQueue.retryJobManual(jobId);
      // if (!result) {
      //   throw new Error('Failed to retry job');
      // }
      return context.send.data({ success: true, message: 'Job retried successfully' });
    } catch (err) {
      console.log(err);
      return context.send.error({ success: false, message: err?.message || 'Unknown error' });
    }
  }
}
