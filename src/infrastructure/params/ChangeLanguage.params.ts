import * as Joi from 'joi';
import { LanguageEnum } from '@ubaytools/core';

export class ChangeLanguageParams {
  language: string;

  constructor(params: any) {
    if (params) {
      this.language = params?.language;
    }
  }

  async validate() {
    return await ChangeLanguageParamsSchema.validateAsync(this);
  }
}

export const ChangeLanguageParamsSchema = Joi.object<ChangeLanguageParams>({
  language: Joi.string().valid(...Object.values(LanguageEnum)),
});
