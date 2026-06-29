import * as Joi from 'joi';
import { SocialTypeEnum, StoreCashbackConfigSchema, StoreCashbackTypeEnum, StoreStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas/TranslateSwagger.schema';
import { StoreCashbackConfigSwaggerSchema } from '../schemas';

@swaggerClass()
export class UpdateStoreParams {
  @swaggerProperty({ type: 'string' }) name: string;
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) description: TranslatesSchema;
  @swaggerProperty({ type: 'string' }) sku: string;
  @swaggerProperty({ type: 'string' }) avatar: string;
  @swaggerProperty({ type: 'string' }) seller: string; // seller Id
  @swaggerProperty({ type: 'string', example: StoreStatusEnum.ACTIVE, description: Object.values(StoreStatusEnum).join('|') })
  status: StoreStatusEnum;
  @swaggerProperty({ type: 'string', required: false, description: 'cover banner image id' }) cover_banner: string;
  @swaggerProperty({ type: 'string', required: false, description: 'cover banner image id' }) cover_mobile_banner: string;
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
  @swaggerProperty({ type: 'number', required: false }) usd_rate: number; // usd rate to convert price in soum from SAP   
  @swaggerProperty({ type: 'object', properties: StoreCashbackConfigSwaggerSchema }) cashbackConfig: StoreCashbackConfigSchema;
  constructor(params: any) {
    this.name = params?.name;
    this.description = params?.description;
    this.sku = params?.sku;
    this.seller = params?.seller;
    this.status = params?.status;
    this.avatar = params?.avatar;
    this.cover_banner = params?.cover_banner;
    this.cover_mobile_banner = params?.cover_mobile_banner;
    this.social_links = params?.social_links;
    this.usd_rate = params?.usd_rate;
    this.cashbackConfig = params?.cashbackConfig;

  }

  async validate() {
    return await UpdateStoreParamsSchema.validateAsync(this);
  }
}

export const UpdateStoreParamsSchema = Joi.object<UpdateStoreParams>({
  name: Joi.string().trim().optional(),
  description: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).optional(),
  sku: Joi.string().trim().optional(),
  seller: Joi.string().trim().optional(),
  status: Joi.string()
    .trim()
    .allow(...Object.values(StoreStatusEnum)),
  avatar: Joi.string().optional(),
  cover_banner: Joi.string().optional(),
  cover_mobile_banner: Joi.string().optional(),
  social_links: Joi.array().items(Joi.object()),
  usd_rate: Joi.number().optional(),
  cashbackConfig: Joi.object({
    enabled: Joi.boolean().required(),
    type: Joi.string().trim().valid(...Object.values(StoreCashbackTypeEnum)).when('enabled', {
      is: Joi.equal(true),
      then: Joi.required(),
      otherwise:Joi.optional()
    }),
    percent: Joi.number().max(100).when('type', {
      is: Joi.equal(StoreCashbackTypeEnum.GENERAL).exist(),
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
