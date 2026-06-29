import { Context } from 'koa';
import { prefix, request, summary, security, tags, query, body } from 'koa-swagger-decorator';
import { OrderAbandonmentParams } from '../../infrastructure';
import { Repository, UserActivityEventsModel, UserActivityEventTypeEnum, LanguageEnum, ProductEntity } from '@ubaytools/core';
import { buildExcelBuffer } from '../../utils/excel';
import { searchNormalization } from '../../utils/searchNormalization';

@prefix('/stats')
export default class ExportOrderAbandonmentExcelController {
  @request('post', '/order-abandonment/download-excel')
  @summary('Download Order Abandonment Excel')
  @security([])
  @tags(['Statistics'])
  @body((OrderAbandonmentParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: OrderAbandonmentParams;
    try {
      params = await new OrderAbandonmentParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const filter: any = {};
      let sort: any = { createdAt: -1 };
      const filterParams: any = params.filter ?? {};
      const sortParams: any = params.sort ?? {};

      if (filterParams?.category) filter.category = filterParams.category;
      if (filterParams?.store) filter.store = filterParams.store;
      if (sortParams?.createdAt) {
        sort.createdAt = sortParams.createdAt;
      }
      if (params?.search) {
        const normalizedSearch = searchNormalization(params.search);
        filter.$or = [
          { 'normalizedSearchFields.name': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.description': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.category': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.tags': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.brand': { $regex: normalizedSearch, $options: 'i' } },
        ];
      }

      const products = await Repository.Products().list({}, filter, sort);

      const productIds = products.map((p) => p.getId());

      const stats = await UserActivityEventsModel.aggregate([
        {
          $facet: {
            normalEvents: [
              {
                $match: {
                  eventType: {
                    $in: [UserActivityEventTypeEnum.VIEW_PRODUCT, UserActivityEventTypeEnum.ADD_TO_CART, UserActivityEventTypeEnum.BEGIN_CHECKOUT],
                  },
                  'metadata.product': { $in: productIds },
                },
              },
              {
                $group: {
                  _id: '$metadata.product',
                  viewProductCount: {
                    $sum: {
                      $cond: [{ $eq: ['$eventType', UserActivityEventTypeEnum.VIEW_PRODUCT] }, 1, 0],
                    },
                  },
                  addToCartCount: {
                    $sum: {
                      $cond: [{ $eq: ['$eventType', UserActivityEventTypeEnum.ADD_TO_CART] }, 1, 0],
                    },
                  },
                  beginCheckoutCount: {
                    $sum: {
                      $cond: [{ $eq: ['$eventType', UserActivityEventTypeEnum.BEGIN_CHECKOUT] }, 1, 0],
                    },
                  },
                  purchaseCount: { $sum: 0 },
                },
              },
            ],
            purchaseEvents: [
              { $match: { eventType: UserActivityEventTypeEnum.PURCHASE } },
              { $unwind: '$metadata.items' },
              {
                $match: {
                  'metadata.items.product': { $in: productIds },
                },
              },
              {
                $group: {
                  _id: '$metadata.items.product',
                  purchaseCount: { $sum: 1 },
                  viewProductCount: { $sum: 0 },
                  addToCartCount: { $sum: 0 },
                  beginCheckoutCount: { $sum: 0 },
                },
              },
            ],
          },
        },
        {
          $project: {
            combined: { $concatArrays: ['$normalEvents', '$purchaseEvents'] },
          },
        },
        { $unwind: '$combined' },
        {
          $group: {
            _id: '$combined._id',
            viewProductCount: { $sum: '$combined.viewProductCount' },
            addToCartCount: { $sum: '$combined.addToCartCount' },
            beginCheckoutCount: { $sum: '$combined.beginCheckoutCount' },
            purchaseCount: { $sum: '$combined.purchaseCount' },
          },
        },
      ]);

      const statsMap = new Map(stats.map((s) => [String(s._id), s]));

      const excelData = products.map((product: ProductEntity, index: number) => {
        const stat = statsMap.get(product.getId().toString());

        return {
          Index: index + 1,
          ProductId: product.getId(),
          ProductName: product.getName()?.getByLang(context.lang || LanguageEnum.UZ) ?? '',
          ViewCount: stat?.viewProductCount ?? 0,
          AddToCart: stat?.addToCartCount ?? 0,
          Checkout: stat?.beginCheckoutCount ?? 0,
          Purchase: stat?.purchaseCount ?? 0,
          ConversionRate: stat?.viewProductCount ? (((stat.purchaseCount || 0) / stat.viewProductCount) * 100).toFixed(2) + '%' : '0%',
        };
      });

      const buffer = buildExcelBuffer(excelData, 'Order Abandonment Stats');
      context.set('Content-Disposition', 'attachment; filename="order-abandonment.xlsx"');
      context.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.body = buffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
