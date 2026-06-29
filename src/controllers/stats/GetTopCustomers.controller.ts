import { LanguageEnum, Redis, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ListParams } from '../../infrastructure';

@prefix('/stats')
export default class GetTopCustomersController {
  @request('get', '/top-customers')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @header({ 'content-language': { type: 'string', example: LanguageEnum.RU, description: 'values: ' + Object.values(LanguageEnum).join(' | ') } })
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    try {
      listParams = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const redisClient = await Redis.getInstance();

      const cacheKey = `${process.env.NODE_ENV}:stats:top-customers:` + `page:${listParams.page}:size:${listParams.size}:lang:${context.lang}`;

      let response: any;

      const cacheData = await redisClient.get(cacheKey);

      if (cacheData) {
        response = JSON.parse(cacheData);
      } else {
        const total = await Repository.Users().countDocumentsByFilter({});
        const users = await Repository.Users().list({ page: listParams.page, size: listParams.size }, {}, { 'userStats.ordersCount': 'desc' });
        const result = users.map((user) => {
          console.log(user);

          return {
            id: user.getId(),
            firstName: user.getUserInfo()?.getFirstname() ?? '',
            lastName: user.getUserInfo()?.getLastname() ?? '',
            phoneNumber: user.getPhoneNumber(),
            avatar: user.getUserInfo()?.getAvatar(),
            orderCount: user.getUserStats()?.getOrdersCount() ?? 0,
          };
        });
        response = {
          total,
          items: result,
        };
        await redisClient.set(cacheKey, JSON.stringify(response), 24 * 60 * 60)
      }
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
