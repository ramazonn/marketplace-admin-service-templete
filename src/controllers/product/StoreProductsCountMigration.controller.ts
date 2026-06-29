import { Context } from 'koa';
import { prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { StoresModel } from '@ubaytools/core'; // to‘g‘ri path qo‘y
import { ProductsModel } from '@ubaytools/core';

@prefix('/product')
export default class StoreProductsCountMigrationController {
  @request('get', '/migration/store-products-count')
  @summary('Recalculate store products count')
  @security([])
  @tags(['Product'])
  static async controller(ctx: Context) {
    try {
        await StoresModel.updateMany({}, [
          {
            $set: {
              storeStats: {
                $ifNull: [
                  '$storeStats',
                  {
                    countOfOrders: 0,
                    countOfProducts: 0,
                    countOfReviews: 0,
                    avgStars: 0,
                  },
                ],
              },
            },
          },
        ]);

      const result = await ProductsModel.aggregate([
        {
          $match: { store: { $ne: null } },
        },
        {
          $group: {
            _id: '$store',
            count: { $sum: 1 },
          },
        },
      ]);

      console.log(result);
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
                'storeStats.countOfProducts': item.count,
              },
            },
          ],
        },
      }));

      console.log(operations);

      const count = await StoresModel.countDocuments();
      console.log('stores count:', count);
      if (operations.length) {
        const res = await StoresModel.bulkWrite(operations);
        console.log(res);
      }

      return ctx.send.data({
        updated: operations.length,
      });
    } catch (error) {
      return ctx.send.error(error);
    }
  }
}
