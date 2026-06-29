import { Context } from 'koa';
import { ListParams, ProductListParams } from '../../infrastructure';
import {
  CategoryEntity,
  FlagEntity,
  LanguageEnum,
  PreOrderShippingInfoSchema,
  ProductEntity,
  ProductsModel,
  ProductStatusEnum,
  Repository,
  StoresEntity,
  TranslatesSchema,
} from '@ubaytools/core';
import { body, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

class ProductListItemResponse {
  id: string;
  name: string;
  description: string;
  short_description: string;
  advantages: string;
  category: { id: string; name: string };
  count: number;
  minimumCount: number;
  store: { id: string; name: string; sku: string };
  country: string;
  price: number;
  discount_percent: number;
  discount_price: number;
  basePrice: number;
  logisticPrice: number;
  attachments: Array<string>;
  videos: Array<string>;
  characteristics: Array<{ key: string; value: TranslatesSchema }>;
  flags: Array<{ id: string; name: string; color: string }>;
  sku: string;
  ikpu: string;
  status: string;
  itemCode: string;
  createdAt: Date;
  avgStars: number = 0;
  starsCount: number = 0;
  soldCount: number = 0;
  countOfReviews: number = 0;
  countOfViews: number = 0;
  categoryPath: string;
  getCountFromEshop: boolean;
  isPreOrder: boolean;
  preOrderShippingInfo: PreOrderShippingInfoSchema;
  syncwithSap: boolean;

  constructor(product: ProductEntity, characteristics: any, lang: LanguageEnum) {
    const baseLang = this.getBaseLanguage(lang);

    this.id = product.getId().toString();
    this.name = product.getName().getByLang(lang);
    this.description = product.getProductInfo()?.getDescription()?.getByLang(lang);
    this.short_description = product.getProductInfo()?.getShortDescription()?.getByLang(lang);
    this.advantages = product.getProductInfo()?.getAdvantages()?.getByLang(lang);
    const category = product.getCategory() as CategoryEntity;
    this.category = category ? { id: category.getId().toString(), name: category.getName().getByLang(lang) } : null;
    this.count = product.getCount();
    this.minimumCount = product.getMinimumCount();
    const store = product.getStore() as StoresEntity;
    this.store = store ? { id: store.getId().toString(), name: store.getName(), sku: store.getShortname() } : null;
    this.country = product.getProductInfo()?.getCountry();
    this.price = product.getProductInfo()?.getCurrentPrice();
    this.discount_percent = product.getProductInfo()?.getDiscountPercent() ?? null;
    this.discount_price = product.getProductInfo()?.getDiscountPrice() ?? null;
    this.basePrice = product.getProductInfo()?.getBasePrice() ?? 0;
    this.logisticPrice = product.getProductInfo()?.getLogisticPrice() ?? 0;
    this.attachments = product.getAttachments() ?? [];
    this.videos = product.getVideos() ?? [];
    this.characteristics = characteristics ?? null;
    this.sku = product.getProductInfo()?.getSKUCode();
    this.ikpu = product.getProductInfo()?.getIKPU();
    this.status = product.getStatus() ?? null;
    this.flags = product
      .getProductInfo()
      .getFlags()
      ?.map((flag: FlagEntity) => {
        return { id: flag.getId().toString(), name: flag.getName().getByLang(lang), color: flag.getColor() };
      });
    this.itemCode = product.getItemCode();
    this.createdAt = product.getCreatedAt();
    this.categoryPath = product.getCategoryPath() ?? null;
    this.soldCount = product.getProductStats()?.getSold() ?? 0;
    this.avgStars = product.getProductStats()?.getAvgStars() ?? 0;
    this.starsCount = product.getProductStats()?.getStarCounts() ?? 0;
    this.countOfViews = product.getProductStats()?.getCountOfViews() ?? 0;
    this.countOfReviews = product.getProductStats()?.getCountOfReviews() ?? 0;
    this.getCountFromEshop = product.getCountFromEshop() ?? false;
    this.isPreOrder = product.getIsPreOrder() ?? false;
    this.preOrderShippingInfo = product.getPreOrderShippingInfo()?.convertToSchema() ?? {};
    this.syncwithSap = product.getSyncwithSap() ?? false;

  }

  private getBaseLanguage(lang: string): string {
    // Extract the base language code (e.g., 'en' from 'en-US')
    const baseLang = lang.split('-')[0].toLowerCase();

    // Map the base language to the supported languages in your system
    const supportedLanguages = ['en', 'ru', 'uz'];
    return supportedLanguages.includes(baseLang) ? baseLang : 'en'; // Default to 'en' if not supported
  }
}

@prefix('/product')
export default class ProductListController {
  @request('post', '/list')
  @summary('Product list')
  @security([])
  @tags(['Product'])
  @query((ListParams as any).swaggerDocument)
  @body((ProductListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ProductListParams;
    let listParams: ListParams;
    try {
      params = await new ProductListParams(context.request.body).validate();
      listParams = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {};
      // Always exclude DELETED unless explicitly requested
      if (params.status) {
        if (Array.isArray(params.status) && params.status.length > 0) {
          filter['status'] = { $in: params.status };
        } else if (!Array.isArray(params.status)) {
          filter['status'] = params.status;
        }
      } else {
        filter['status'] = { $ne: ProductStatusEnum.DELETED };
      }

      if (params.syncwithSap !== undefined) {
        filter['syncwithSap'] = params.syncwithSap;
      }

      if (params.search) {
        filter['$or'] = [
          { 'name.uz': { $regex: params.search, $options: 'i' } },
          { 'name.ru': { $regex: params.search, $options: 'i' } },
          { 'name.en': { $regex: params.search, $options: 'i' } },
          { 'description.uz': { $regex: params.search, $options: 'i' } },
          { 'description.ru': { $regex: params.search, $options: 'i' } },
          { 'description.en': { $regex: params.search, $options: 'i' } },
          { 'infos.sku_code': { $regex: params.search, $options: 'i' } },
          { 'itemCode': { $regex: params.search, $options: 'i' } },
        ];
      }

      const sort = {};
      sort['createdAt'] = -1;
      if (params.sort) {
        const sortOrder = params.sort.operator === 'asc' ? 1 : -1;
        switch (params.sort.field) {
          case 'order': {
            sort['stats.sold'] = sortOrder;
            break;
          }
          case 'count': {
            sort['count'] = sortOrder;
            break;
          }
          case 'price': {
            sort['infos.current_price'] = sortOrder;
            break;
          }
          case 'avgStars': {
            sort['stats.avgStars'] = sortOrder;
          }
        }
      }

      // Add store name filter
      if (params.store) {
        const stores = await Repository.Stores().list({ page: 1, size: 1000 }, { name: { $regex: params.store, $options: 'i' } });
        const storeIds = stores.map((store) => store.getId());
        filter['store'] = { $in: storeIds };
      }

      const agg = [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ];
      // const count = await Repository.Products().countDocumentsByFilter(filter);
      const countResult = await ProductsModel.aggregate(agg)
      const formattedCounts: Record<string, number> = {};
      countResult.forEach((r) => {
        formattedCounts[r._id] = r.count;
      });

      // Fill missing statuses with 0
      const countResponse: Record<string, number> = {};
      Object.values([ProductStatusEnum.ARCHIVED, ProductStatusEnum.DRAFT, ProductStatusEnum.LOW_STOCK, ProductStatusEnum.IN_STOCK, ProductStatusEnum.OUT_OF_STOCK]).forEach((status) => {
        countResponse[status] = formattedCounts[status] || 0;
      });

      // Add total
      countResponse.total = Object.values(countResponse).reduce(
        (sum, val) => sum + (typeof val === "number" ? val : 0),
        0,
      );
      const products = await Repository.Products().list({ page: listParams.page, size: listParams.size }, filter, sort);
      const response = await Promise.all(
        products.map(async (product) => {
          const characteristics = await Promise.all(
            product
              .getProductInfo()
              .getCharacteristics()
              .map(async (pair) => {
                const key = await Repository.Characteristics().getById(new Types.ObjectId(pair.key));
                return { key: key.getKey().getByLang(context.lang), value: pair.value?.[context.lang.toLowerCase()] };
              }),
          );
          const detail = new ProductListItemResponse(product, characteristics, context.lang);
          return detail;
        }),
      );
      return context.send.data({ count: countResponse, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
