import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import {
  BrandsEntity,
  CategoryEntity,
  FlagEntity,
  LanguageEnum,
  ModelsEntity,
  NotFoundError,
  PreOrderShippingInfoSchema,
  ProductEntity,
  Repository,
  ReviewsModel,
  StoreCashbackConfigSchema,
  StoresEntity,
  TranslatesSchema,
} from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

export class ProductResponse {
  id: string;
  name: TranslatesSchema;
  description: TranslatesSchema;
  short_description: TranslatesSchema;
  advantages: TranslatesSchema;
  category: { id: string; name: string };
  count: number;
  minimumCount: number;
  store: { id: string; name: string; sku: string, cashbackConfig: StoreCashbackConfigSchema };
  country: string;
  price: number;
  basePrice: number;
  logisticPrice: number;
  discount_percent: number;
  discount_price: number;
  attachments: Array<string>;
  videos: Array<string>;
  characteristics: Array<{ key: string; value: TranslatesSchema }>;
  ikpu: string;
  sku: string;
  model: { id: string; name: string };
  brand: { id: string; name: string };
  guaranty: number;
  status: string;
  flags: Array<{ id: string; name: string; color: string }>;
  itemCode: string;
  categoryPath: string;
  stats: { sold: number, avgStars: number, starsCount: number, countOfReviews: number, countOfViews: number };
  getCountFromEshop: boolean;
  cashbackPercent: number;
  isPreOrder: boolean;
  preOrderShippingInfo: PreOrderShippingInfoSchema;
  searchTags: Array<string>;
  syncwithSap: boolean

  constructor(product: ProductEntity, lang: LanguageEnum) {
    this.id = product.getId().toString();
    this.name = product.getName().convertToSchema();
    this.description = product.getProductInfo()?.getDescription()?.convertToSchema();
    this.short_description = product.getProductInfo()?.getShortDescription()?.convertToSchema();
    this.advantages = product.getProductInfo()?.getAdvantages()?.convertToSchema();
    const category = product.getCategory() as CategoryEntity;
    this.category = category ? { id: category.getId().toString(), name: category.getName().getByLang(lang) } : null;
    this.count = product.getCount();
    this.minimumCount = product.getMinimumCount();
    const store = product.getStore() as StoresEntity;
    this.store = store ? { id: store.getId().toString(), name: store.getName(), sku: store.getShortname(), cashbackConfig: store?.getCashbackConfig()?.convertToSchema() ?? {} } : null;
    this.country = product.getProductInfo()?.getCountry();
    this.price = product.getProductInfo()?.getCurrentPrice();
    this.basePrice = product.getProductInfo()?.getBasePrice();
    this.logisticPrice = product.getProductInfo()?.getLogisticPrice();
    this.discount_percent = product.getProductInfo()?.getDiscountPercent() ?? null;
    this.discount_price = product.getProductInfo()?.getDiscountPrice() ?? null;
    this.attachments = product.getAttachments() ?? [];
    this.videos = product.getVideos() ?? [];
    this.characteristics = product.getProductInfo()?.getCharacteristics();
    this.ikpu = product.getProductInfo()?.getIKPU();
    this.sku = product.getProductInfo()?.getSKUCode();
    this.guaranty = product.getProductInfo()?.getGuaranty();
    this.status = product.getStatus() ?? null;
    const info = product.getProductInfo();
    this.model = info
      ? { id: (info.getModel() as ModelsEntity)?.getId()?.toString(), name: (info.getModel() as ModelsEntity)?.getTitle().getByLang(lang) }
      : null;
    this.brand = info
      ? { id: (info.getBrand() as BrandsEntity)?.getId()?.toString(), name: (info.getBrand() as BrandsEntity)?.getTitle().getByLang(lang) }
      : null;
    this.flags = product
      .getProductInfo()
      .getFlags()
      ?.map((flag: FlagEntity) => {
        return { id: flag.getId().toString(), name: flag.getName().getByLang(lang), color: flag.getColor() };
      });
    this.itemCode = product.getItemCode();
    this.categoryPath = product.getCategoryPath() ?? null;
    this.stats = product.getProductStats() ? { sold: product.getProductStats().getSold(), avgStars: product.getProductStats().getAvgStars(), starsCount: product.getProductStats().getStarCounts(), countOfReviews: product.getProductStats().getCountOfReviews(), countOfViews: product.getProductStats().getCountOfViews() } : null;
    this.getCountFromEshop = product.getCountFromEshop() ?? false;
    this.cashbackPercent = product.getCashbackPercent() ?? null;
    this.isPreOrder = product.getIsPreOrder() ?? false;
    this.preOrderShippingInfo = product.getPreOrderShippingInfo()?.convertToSchema() ?? {};
    this.searchTags = product.getSearchTags() ?? [];
    this.syncwithSap = product.getSyncwithSap() ?? false;

  }
}

@prefix('/product')
export default class GetProductDetailController {
  @request('get', '/detail/{productId}')
  @summary('Product full detail')
  @security([])
  @tags(['Product'])
  @path({ productId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.productId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const product = await Repository.Products().getById(new Types.ObjectId(params.id));
      if (!product) {
        throw new NotFoundError('Product');
      }
      const response = new ProductResponse(product, context.lang);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
  static async getProductStars(filter: any) {
    const aggregationPipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          starCounts: {
            $push: {
              k: { $toString: { $trunc: '$stars' } },
              v: { $sum: 1 },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          stars: { $arrayToObject: '$starCounts' },
        },
      },
    ];

    return ReviewsModel.aggregate(aggregationPipeline);
  }
}
