import { prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { NotFoundError, Repository } from '@ubaytools/core';

@prefix('/delivery-point')
export default class DeliveryPointController {
  @request('get', '/list')
  @summary('Delivery point list')
  @security([])
  @tags(['Address'])
  static async controller(context: Context): Promise<void> {
    try {
      const found = await Repository.UzpostDeliveryPoint().getDeliveryPoints();
      if (!found) {
        throw new NotFoundError('Delivery Point not found');
      }

      return context.send.data(found.getRegions() || []);
    } catch (error) {
      console.error('Error in DeliveryPointController:', error);
      return context.send.error(error);
    }
  }
}
