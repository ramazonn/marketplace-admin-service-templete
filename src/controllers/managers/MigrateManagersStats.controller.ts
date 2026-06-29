import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { Repository, ManagerStatsEntity, OrderStatusEnum } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/manager')
export default class MigrateManagersStatsController {
  @request('post', '/migrate-managers-stats')
  @summary('Migrate managers stats')
  @security([])
  @tags(['Manager'])
  static async controller(context: Context): Promise<void> {
    try {
      const count = await Repository.Managers().countDocumentsByFilter({});
      const managers = await Repository.Managers().list({ page: 1, size: 1000 });
        const response = await Promise.all(managers.map(async (entity) => {
          const orders = await Repository.Orders().list({}, { manager: entity.getId(),status:OrderStatusEnum.DELIVERED });
          const totalAmount = orders.reduce((acc, order) => acc + order.getTotalAmount(), 0);
          const managerStats = entity.getStats() ?? new ManagerStatsEntity();
          managerStats.buildOrdersCount(orders.length);
          managerStats.buildOrdersAmount(totalAmount);
          entity.buildStats(managerStats.convertToSchema());
          await Repository.Managers().update(entity);
          return { id: entity.getId().toString(), name: entity.getName(), stats:entity.getStats() || {} };
        }))
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
