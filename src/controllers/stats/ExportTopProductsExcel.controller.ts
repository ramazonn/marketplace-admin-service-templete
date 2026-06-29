import { LanguageEnum, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { body, header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { GetTopProductsParams, ListParams } from '../../infrastructure';
import { buildExcelBuffer } from '../../utils/excel';

@prefix('/stats')
export default class ExportTopProductsExcelController {
  @request('post', '/top-products/download-excel')
  @summary('Download Excel of Top Products')
  @security([])
  @tags(['Statistics'])
  @header({
    'content-language': {
      type: 'string',
      example: LanguageEnum.RU,
      description: 'values: ' + Object.values(LanguageEnum).join(' | '),
    },
  })
  @body((GetTopProductsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: GetTopProductsParams;
    try {
      params = await new GetTopProductsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const filter: any = {
        status: { $ne: ProductStatusEnum.DELETED },
      };

      if (params.store) {
        filter.store = params.store;
      }
      const products = await Repository.Products().list({}, filter, { 'stats.sold': -1 });

      const excelData = products.map((product, index) => ({
        Rank: index + 1,
        ID: product.getId()?.toString() ?? '',
        Name: product.getName()?.getByLang(context.lang) ?? '',
        AvgStars: product.getProductStats()?.getAvgStars() ?? 0,
        SoldCount: product.getProductStats()?.getSold() ?? 0,
      }));

      const buffer = buildExcelBuffer(excelData, 'Top Products');

      context.set('Content-Disposition', 'attachment; filename="top-products.xlsx"');
      context.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.body = buffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
