import { body, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ListParams, OrderAbandonmentParams, RequiredDateFilterParams } from '../../infrastructure';
import { Context } from 'koa';
import {
  UserActivityEventTypeEnum,
  UserActivityEventsModel,
  Repository,
  ProductEntity,
  PreOrderShippingInfoSchema,
  LanguageEnum,
  CategoryEntity,
  StoresEntity,
  TranslatesSchema,
  FlagEntity,
  Redis,
} from '@ubaytools/core';
import { searchNormalization } from '../../utils';

class OrderAbandonmentStatsItemResponse {
  product: {
    id: string;
    name: string;
    description: string | null;
    attachments: string[] | null;
    viewProductCount: number;
    addToCartCount: number;
    beginCheckoutCount: number;
    purchaseCount: number;
  };

  constructor(product: ProductEntity, stat: any, lang?: LanguageEnum) {
    const baseLang = this.getBaseLanguage(lang) as LanguageEnum;
    const productInfo = product.getProductInfo();

    this.product = {
      id: product.getId().toString(),
      name: product.getName()?.getByLang(baseLang) ?? '',
      description: productInfo?.getDescription()?.getByLang(baseLang) ?? null,
      attachments: product.getAttachments() ?? null,
      viewProductCount: stat?.viewProductCount ?? 0,
      addToCartCount: stat?.addToCartCount ?? 0,
      beginCheckoutCount: stat?.beginCheckoutCount ?? 0,
      purchaseCount: stat?.purchaseCount ?? 0,
    };
  }

  private getBaseLanguage(lang?: string): string {
    if (!lang) return 'uz';

    const baseLang = lang.split('-')[0].toLowerCase();
    const supportedLanguages = ['en', 'ru', 'uz'];

    return supportedLanguages.includes(baseLang) ? baseLang : 'uz';
  }
}

@prefix('/stats')
export default class GetOrderAbandonmentStatsController {
  @request('post', '/order-abandonment')
  @summary('Order funnel statistics')
  @security([])
  @tags(['Statistics'])
  @query((ListParams as any).swaggerDocument)
  @body((OrderAbandonmentParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    let params: OrderAbandonmentParams;

    try {
      listParams = await new ListParams(context.request.query).validate();
      params = await new OrderAbandonmentParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const clientRedis = await Redis.getInstance();
      let response: any;

      const filter: any = {};
      let sort: any = { createdAt: -1 };

      const filterParams: any = params.filter ?? {};
      const sortParams: any = params.sort ?? {};

      let cacheKey =
        `${process.env.NODE_ENV}:order:abandonment:page:${listParams.page}:size:${listParams.size}:`

      if (filterParams?.category) {
        cacheKey += `category:${filterParams.category}:`;
        filter.category = filterParams.category;
      }
      if (filterParams?.store) {
        cacheKey += `store:${filterParams.store}:`;
        filter.store = filterParams.store;
      }
      if (sortParams?.createdAt) {
        cacheKey += `sort:createdAt:${sortParams.createdAt}:`;
        sort.createdAt = sortParams.createdAt;
      }
      if (params?.search) {
        cacheKey += `search:${params.search}:`;
        const normalizedSearch = searchNormalization(params.search);
        filter.$or = [
          { 'normalizedSearchFields.name': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.description': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.category': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.tags': { $regex: normalizedSearch, $options: 'i' } },
          { 'normalizedSearchFields.brand': { $regex: normalizedSearch, $options: 'i' } },
        ];
      }

      const cachedData = await clientRedis.get(cacheKey);

      if (cachedData) {
        response = JSON.parse(cachedData);
      } else {
        const products = await Repository.Products().list({ page: listParams.page, size: listParams.size }, filter, sort);

        const productIds = products.map((item) => item.getId());

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
                {
                  $match: {
                    eventType: UserActivityEventTypeEnum.PURCHASE,
                  },
                },
                {
                  $unwind: '$metadata.items',
                },
                {
                  $match: {
                    'metadata.items.product': { $in: productIds },
                  },
                },
                {
                  $group: {
                    _id: '$metadata.items.product',
                    viewProductCount: { $sum: 0 },
                    addToCartCount: { $sum: 0 },
                    beginCheckoutCount: { $sum: 0 },
                    purchaseCount: { $sum: 1 },
                  },
                },
              ],
            },
          },
          {
            $project: {
              combined: {
                $concatArrays: ['$normalEvents', '$purchaseEvents'],
              },
            },
          },
          {
            $unwind: '$combined',
          },
          {
            $group: {
              _id: '$combined._id',
              viewProductCount: { $sum: '$combined.viewProductCount' },
              addToCartCount: { $sum: '$combined.addToCartCount' },
              beginCheckoutCount: { $sum: '$combined.beginCheckoutCount' },
              purchaseCount: { $sum: '$combined.purchaseCount' },
            },
          },
          {
            $project: {
              _id: 0,
              productId: '$_id',
              viewProductCount: 1,
              addToCartCount: 1,
              beginCheckoutCount: 1,
              purchaseCount: 1,
            },
          },
        ]);

        const statsMap = new Map(stats.map((item) => [String(item.productId), item]));

        const total = await Repository.Products().countDocumentsByFilter(filter);

        const result = products.map((product) => {
          const stat = statsMap.get(String(product.getId()));
          return new OrderAbandonmentStatsItemResponse(product, stat, context.lang);
        });
        response = {
          total,
          items: result,
        };
        await clientRedis.set(cacheKey, JSON.stringify(response), 60 * 60);
      }

      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
