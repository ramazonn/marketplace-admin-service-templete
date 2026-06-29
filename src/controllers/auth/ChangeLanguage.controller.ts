import { Context } from 'koa';

import { AdminsEntity, LanguageEnum, Repository } from '@ubaytools/core';
import { ChangeLanguageParams } from '../../infrastructure';

export default class ChangeLanguageController {
  static async controller(context: Context): Promise<void> {
    let params: ChangeLanguageParams;
    try {
      params = await new ChangeLanguageParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const admin = context.admin as AdminsEntity;
      admin.buildLanguage(params.language as LanguageEnum);
      await Repository.Admins().update(admin);
      return context.send.data({ language: params.language });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
