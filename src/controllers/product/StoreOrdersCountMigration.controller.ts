import { Context } from 'koa';
import { prefix, request, summary, tags } from 'koa-swagger-decorator';
import { StoresModel, OrderModel, StoreOrderModel } from '@ubaytools/core';
import { Types } from 'mongoose';

@prefix('/product')
export default class StoreOrdersCountMigrationController {
  @request('get', '/migration/store-orders-count')
  @summary('Recalculate store orders count')
  @tags(['Product'])
  static async controller(ctx: Context) {
    try {
      // 1. DELIVERED orderlarni olamiz
      const deliveredOrders = await OrderModel.find({ status: 'DELIVERED' }, { _id: 1 });

      const orderIds = deliveredOrders.map((o) => o._id);

      console.log('DELIVERED ORDERS:', orderIds.length);

      const result = await StoreOrderModel.aggregate([
        {
          $match: {
            orderId: { $in: orderIds },
          },
        },
        {
          $group: {
            _id: '$storeId',
            count: { $sum: 1 },
          },
        },
      ]);


      await StoresModel.updateMany(
        {},
        {
          $set: { 'storeStats.countOfOrders': 0 },
        },
      );

      const operations = result.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: [
            {
              $set: {
                storeStats: { $ifNull: ['$storeStats', {}] },
              },
            },
            {
              $set: {
                'storeStats.countOfOrders': item.count,
              },
            },
          ],
        },
      }));

      console.log(JSON.stringify(operations, null, 2));

      if (operations.length) {
        await StoresModel.bulkWrite(operations);
      }

      return ctx.send.data({
        updated: operations.length,
      });
    } catch (error) {
      return ctx.send.error(error);
    }
  }
}
