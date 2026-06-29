import { Context } from 'koa';
import { ReOrderBannerPromotionParams } from '../../infrastructure';
import { Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/promotion')
export default class ReOrderBannerPromotionsController {
  @request('put', '/reorder-banners')
  @summary('Promotion update')
  @security([])
  @tags(['Promotion'])
  @body((ReOrderBannerPromotionParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ReOrderBannerPromotionParams;
    try {
      params = await new ReOrderBannerPromotionParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const ids = params.ids.map(el => new Types.ObjectId(el));

      const foundBanners = await Repository.Promotions().list({}, { _id: { $in: [...ids] } });
      const bannerMap = new Map(foundBanners.map(b => [b.getId().toString(), b]));

      // prepare bulk update operations
      const bulkOps = ids
        .map((id, index) => {
          const banner = bannerMap.get(id.toString());
          if (!banner) return null;
          return {
            updateOne: {
              filter: { _id: id },
              update: { $set: { order: index + 1 } },
            },
          };
        })
        .filter(Boolean);

      if (bulkOps.length > 0) {
        await Repository.Promotions().bulkWrite(bulkOps);
      }

      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
