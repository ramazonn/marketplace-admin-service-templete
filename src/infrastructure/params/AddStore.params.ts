import * as Joi from 'joi';
import { TranslatesSchema, SocialTypeEnum, StoreCashbackTypeEnum, StoreCashbackConfigSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { StoreCashbackConfigSwaggerSchema, TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddStoreParams {
  @swaggerProperty({ type: 'string', required: true }) name: string;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string', required: false }) sku: string;
  @swaggerProperty({ type: 'number', required: false }) usd_rate: number; // usd rate to convert price in soum from SAP
  @swaggerProperty({ type: 'string', required: true }) seller: string; // seller Id
  @swaggerProperty({ type: 'string', required: false }) avatar: string; // avatar image Id
  @swaggerProperty({ type: 'string', required: false, description: 'cover banner image id' }) cover_banner: string; // cover banner image Id
  @swaggerProperty({ type: 'string', required: false, description: 'cover banner image id' }) cover_mobile_banner: string; // cover banner image Id
  @swaggerProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        link: Joi.string().trim().required(),
        type: Joi.string().trim().required(),
      },
    },
    required: false,
    description: 'type: ' + Object.values(SocialTypeEnum).join(' | '),
  })
  social_links: Array<{ type: SocialTypeEnum; link: string }>;  
  @swaggerProperty({ type: 'object', properties: StoreCashbackConfigSwaggerSchema}) cashbackConfig: StoreCashbackConfigSchema;

  constructor(params: any) {
    this.name = params?.name;
    this.description = params?.description;
    this.sku = params?.sku;
    this.usd_rate = params?.usd_rate;
    this.seller = params?.seller;
    this.avatar = params?.avatar;
    this.cover_banner = params?.cover_banner;
    this.cover_mobile_banner = params?.cover_mobile_banner;
    this.social_links = params?.social_links;
    this.cashbackConfig = params?.cashbackConfig;
  }

  async validate() {
    return await AddStoreParamsSchema.validateAsync(this);
  }
}

export const AddStoreParamsSchema = Joi.object<AddStoreParams>({
  name: Joi.string().trim().required(),
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  sku: Joi.string().trim().optional(),
  seller: Joi.string().trim().optional(),
  usd_rate: Joi.number().optional(),
  avatar: Joi.string().optional(),
  cover_banner: Joi.string().optional(),
  cover_mobile_banner: Joi.string().optional(),
  social_links: Joi.array().items(Joi.object()),
  cashbackConfig: Joi.object({
    enabled: Joi.boolean().required(),
    type: Joi.string().trim().valid(...Object.values(StoreCashbackTypeEnum)).when('enabled', {
      is: Joi.equal(true),
      then: Joi.required(),
      otherwise:Joi.optional()
    }),
    percent: Joi.number().max(100).when('type', {
      is: Joi.equal(StoreCashbackTypeEnum.GENERAL),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).optional(),
    includeDiscounted: Joi.boolean().when('enabled', {
      is: Joi.equal(true),
      then: Joi.required(),
      otherwise:Joi.optional()
    }),
    minimumOrderAmountToUseCashback: Joi.number().when('enabled', {
      is: Joi.equal(true),
      then: Joi.required(),
      otherwise:Joi.optional()
    })
  }).optional(),
});
