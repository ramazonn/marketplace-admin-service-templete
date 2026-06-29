import { Context } from 'koa';
import { prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { LanguageEnum, PERMISSION_CATALOG } from '@ubaytools/core';

@prefix('/permissions')
export default class GetPermissionCatalogController {
  @request('get', '/catalog')
  @summary('Permission catalog grouped')
  @security([])
  @tags(['Permissions'])
  static async controller(context: Context): Promise<void> {
    try {
      const base = (context.lang || LanguageEnum.EN).split('-')[0].toUpperCase();
      const lang =
        base === 'UZ' ? LanguageEnum.UZ :
          base === 'RU' ? LanguageEnum.RU :
            LanguageEnum.EN;

      const grouped: Record<string, any[]> = {};

      for (const permission of PERMISSION_CATALOG) {
        const groupName =
          permission.group?.[lang] ??
          permission.group?.[LanguageEnum.EN] ??
          'Other';

        if (!grouped[groupName]) {
          grouped[groupName] = [];
        }

        grouped[groupName].push({
          id: permission.id,
          label:
            permission.label?.[lang] ??
            permission.label?.[LanguageEnum.EN],
        });
      }

      return context.send.data({
        groups: grouped,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}