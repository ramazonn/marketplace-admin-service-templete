import { LanguageEnum, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { GetTopProductsParams, ListParams } from '../../infrastructure';
import { Redis } from '@ubaytools/core';

@prefix('/stats')
export default class GetTopProductsController {
  @request('get', '/top-products')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @header({
    'content-language': {
      type: 'string',
      example: LanguageEnum.RU,
      description: 'values: ' + Object.values(LanguageEnum).join(' | '),
    },
  })
  @query((ListParams as any).swaggerDocument)
  @query((GetTopProductsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    let params: GetTopProductsParams;
    try {
      listParams = await new ListParams(context.request.query).validate();
      params = await new GetTopProductsParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const redisClient = await Redis.getInstance();

      let cacheKey = `${process.env.NODE_ENV}:stats:top-products:page:${listParams.page}:size:${listParams.size}:lang:${context.lang}:`;
      
      let response: any = await redisClient.get(cacheKey);
      const matchStage: any = {
        status: { $ne: ProductStatusEnum.DELETED },
      };

      if (params.store) {
        cacheKey += `store:${params.store}:`;
        matchStage.store = params.store;
      }

      if (response) {
        response = JSON.parse(response);
      } else {
      const total = await Repository.Products().countDocumentsByFilter(matchStage);

      const products = await Repository.Products().list({ page: listParams.page, size: listParams.size }, matchStage, { 'stats.sold': 'desc' });

      const result = products.map((product) => ({
        id: product.getId(),
        name: product.getName().getByLang(context.lang),
        avgStars: product.getProductStats()?.getAvgStars() ?? 0,
        soldCount: product.getProductStats()?.getSold() ?? 0,
        attachment: product.getAttachments(),
      }));
      response = {
        total,
        items: result,
      };
      await redisClient.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
    }
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
