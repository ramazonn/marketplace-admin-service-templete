import { Context } from 'koa';
import { prefix, request, summary, tags } from 'koa-swagger-decorator';
import { ReviewsModel, StoresModel } from '@ubaytools/core';

@prefix('/product')
export default class StoreReviewsStatsMigrationController {
  @request('get', '/migration/store-reviews-stats')
  @summary('Recalculate store reviews stats')
  @tags(['Product'])
  static async controller(ctx: Context) {
    try {
      const result = await ReviewsModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $match: {
            'product.store': { $ne: null },
            stars: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$product.store',
            count: { $sum: 1 },
            avgStars: { $avg: '$stars' },
          },
        },
      ]);

      console.log('AGG RESULT:', result);

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
                'storeStats.countOfReviews': item.count,
                'storeStats.avgStars': Number(item.avgStars.toFixed(1)),
              },
            },
          ],
        },
      }));

      console.log('OPS:', JSON.stringify(operations, null, 2));

      if (operations.length) {
        const res = await StoresModel.bulkWrite(operations);
        console.log('BULK RESULT:', res);
      }

      return ctx.send.data({
        updated: operations.length,
      });
    } catch (error) {
      return ctx.send.error(error);
    }
  }
}
