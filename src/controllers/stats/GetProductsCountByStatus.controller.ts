import { ProductsModel, ProductStatusEnum } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query, body } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { ProductCountByStatusParams } from '../../infrastructure';

@prefix('/stats')
export default class GetProductsCountByStatusController {
  @request('get', '/products-by-status')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @query((ProductCountByStatusParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ProductCountByStatusParams;
    try {
      params = await new ProductCountByStatusParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {

      const matchStage: any = {};

      if (params.store) {
        matchStage.store = new Types.ObjectId(params.store);
      }

      let result = await ProductsModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1,
          },
        },
      ]);
      let totalCount = 0;
      const statusses = Object.values([
        ProductStatusEnum.ARCHIVED,
        ProductStatusEnum.DRAFT,
        ProductStatusEnum.IN_STOCK,
        ProductStatusEnum.LOW_STOCK,
        ProductStatusEnum.OUT_OF_STOCK,
      ]).map((status) => {
        const found = result.find((r) => r.status === status);
        const count = found ? found.count : 0;
        totalCount += count;
        return {
          status,
          count,
        };
      });

      return context.send.data({ statusses, totalCount });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
