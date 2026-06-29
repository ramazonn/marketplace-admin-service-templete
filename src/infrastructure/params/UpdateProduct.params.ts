import * as Joi from 'joi';
import { PreOrderShippingInfoSchema, ProductStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { KeyValueSwaggerSchema, PreOrderShippingInfoSwaggerSchema, TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateProductParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) name: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string', example: ProductStatusEnum.IN_STOCK, description: Object.values(ProductStatusEnum).join(' | ') }) status: ProductStatusEnum;
  @swaggerProperty({ type: 'string' }) category: string;
  @swaggerProperty({ type: 'string' }) country: string;
  @swaggerProperty({ type: 'string' }) brand: string;
  @swaggerProperty({ type: 'string' }) model: string;
  @swaggerProperty({ type: 'number' }) guaranty: number;
  @swaggerProperty({ type: 'string' }) store: string;
  @swaggerProperty({ type: 'string' }) sku: string;
  @swaggerProperty({ type: 'string' }) ikpu: string;
  @swaggerProperty({ type: 'number' }) weight: number;
  @swaggerProperty({ type: 'number' }) volume: number;
  @swaggerProperty({ type: 'string' }) packageCode: string;
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) attachments: Array<string>;
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) videos: Array<string>;
  @swaggerProperty({
    type: 'array',
    items: { type: 'object', properties: { key: { type: 'string', required: true }, value: { type: TranslateSwaggerSchema, required: true } } },
  })
  characteristics: Array<{
    key: string;
    value: TranslatesSchema;
  }>;
  @swaggerProperty({ type: 'number' }) price: number;
  @swaggerProperty({ type: 'number' }) basePrice: number;
  @swaggerProperty({ type: 'number' }) discount_percent: number;
  @swaggerProperty({ type: 'number' }) discount_price: number;
  @swaggerProperty({ type: 'number' }) logisticPrice: number;
  @swaggerProperty({ type: 'string' }) itemCode: string;
  @swaggerProperty({ type: 'string' }) categoryPath: string;
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) flags: Array<string>;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) advantages: TranslatesSchema;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) short_description: TranslatesSchema;
  @swaggerProperty({ type: 'number' }) minimumCount: number;
  @swaggerProperty({ type: 'number' }) count: number;
  @swaggerProperty({ type: 'boolean' }) getCountFromEshop: boolean;
  @swaggerProperty({ type: 'number' }) cashbackPercent: number;
  @swaggerProperty({ type: 'boolean' }) isPreOrder: boolean;
  @swaggerProperty({ type: 'object', properties: PreOrderShippingInfoSwaggerSchema }) preOrderShippingInfo: PreOrderShippingInfoSchema;
  @swaggerProperty({ type: 'array', items: { type: 'string' } }) searchTags: Array<string>;
  @swaggerProperty({ type: 'boolean' }) syncwithSap: boolean;


  constructor(params: any) {
    this.name = params?.name;
    this.description = params?.description;
    this.status = params?.status;
    this.category = params?.category; // last sub category
    this.country = params?.country;
    this.brand = params?.brand;
    this.model = params?.model;
    this.guaranty = params?.guaranty;
    this.store = params?.store;
    this.sku = params?.sku;
    this.ikpu = params?.ikpu;
    this.weight = params?.weight;
    this.volume = params?.volume;
    this.packageCode = params?.packageCode;
    this.attachments = params?.attachments;
    this.videos = params?.videos;
    this.characteristics = params?.characteristics;
    this.price = params?.price;
    this.logisticPrice = params?.logisticPrice;
    this.basePrice = params?.basePrice;
    this.flags = params?.flags;
    this.itemCode = params?.itemCode;
    this.categoryPath = params?.categoryPath;
    this.advantages = params?.advantages;
    this.short_description = params?.short_description;
    this.minimumCount = params?.minimumCount;
    this.count = params?.count;
    this.getCountFromEshop = params?.getCountFromEshop;
    this.discount_percent = params?.discount_percent;
    this.discount_price = params?.discount_price;
    this.cashbackPercent = params?.cashbackPercent;
    this.isPreOrder = params?.isPreOrder;
    this.preOrderShippingInfo = params?.preOrderShippingInfo;
    this.searchTags = params?.searchTags;
    this.syncwithSap = params?.syncwithSap;

  }

  async validate() {
    return await UpdateProductParamsSchema.validateAsync(this);
  }
}

export const UpdateProductParamsSchema = Joi.object<UpdateProductParams>({
  name: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  status: Joi.string()
    .trim()
    .valid(...Object.values(ProductStatusEnum))
    .optional(),
  short_description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  advantages: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  category: Joi.string(),
  country: Joi.string().optional(),
  brand: Joi.string().optional(),
  model: Joi.string().optional(),
  guaranty: Joi.number().optional(),
  store: Joi.string().optional(),
  sku: Joi.string().optional(),
  ikpu: Joi.string().optional(),
  weight: Joi.number().optional(),
  volume: Joi.number().optional(),
  packageCode: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
  videos: Joi.array().items(Joi.string()).optional(),
  characteristics: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.object().required(),
      }),
    )
    .optional(),
  price: Joi.number().optional(),
  logisticPrice: Joi.number().optional(),
  basePrice: Joi.number().optional(),
  itemCode: Joi.string().optional(),
  categoryPath: Joi.string().optional(),
  flags: Joi.array().items(Joi.string()).optional(),
  minimumCount: Joi.number().optional(),
  count: Joi.number().optional(),
  getCountFromEshop: Joi.boolean().optional(),
  discount_percent: Joi.number().min(0).max(100).allow(null).optional(),
  discount_price: Joi.number().allow(null).when('discount_percent', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  cashbackPercent: Joi.number().optional(),
  isPreOrder: Joi.boolean().optional(),
  preOrderShippingInfo: Joi.object({
    shippingDaysFrom: Joi.number().required(),
    shippingDaysTo: Joi.number().required()
  }).when('isPreOrder', {
    is: Joi.exist().equal(true),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  searchTags: Joi.array().items(Joi.string().trim()).optional(),
  syncwithSap: Joi.boolean().optional(),
});
