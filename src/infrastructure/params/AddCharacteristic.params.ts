import * as Joi from 'joi';
import { CharacterStatusEnum, TranslatesSchema } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { TranslateSwaggerSchema } from '../schemas';

@swaggerClass()
export class AddCharacteristicParams {
  @swaggerProperty({ type: 'object', properties: TranslateSwaggerSchema }) key: TranslatesSchema;
  @swaggerProperty({ type: 'array', items: { type: 'object', properties: TranslateSwaggerSchema } }) values: Array<TranslatesSchema>;
  @swaggerProperty({ type: 'string', example: CharacterStatusEnum.ACTIVE, description: Object.values(CharacterStatusEnum).join('|') })
  status: CharacterStatusEnum;
  @swaggerProperty({ type: 'boolean' }) isPin: boolean;

  constructor(params: any) {
    this.key = params?.key;
    this.values = params?.values;
    this.status = params?.status ?? CharacterStatusEnum.ACTIVE;
    this.isPin = params?.isPin;
  }

  async validate() {
    return await AddCharacteristicParamsSchema.validateAsync(this);
  }
}

export const AddCharacteristicParamsSchema = Joi.object<AddCharacteristicParams>({
  key: Joi.object({
    uz: Joi.string().trim().allow(null),
    ru: Joi.string().trim().allow(null),
    en: Joi.string().trim().allow(null),
  }).required(),
  values: Joi.array()
    .items({
      uz: Joi.string().trim().allow(null),
      ru: Joi.string().trim().allow(null),
      en: Joi.string().trim().allow(null),
    })
    .required(),
  status: Joi.object().allow(...Object.values(CharacterStatusEnum)),
  isPin: Joi.boolean().default(false),
});
