import { LanguageEnum, Redis, Repository, UserEntity } from '@ubaytools/core';
import { Context } from 'koa';
import { header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ListParams, GetTopCashbackCustomersParams } from '../../infrastructure';
import { Types } from 'mongoose';


@prefix('/stats')
export default class GetTopCashbackEarnedCustomersController {
  @request('get', '/top-cashback-earned-customers')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])
  @header({ 'content-language': { type: 'string', example: LanguageEnum.RU, description: 'values: ' + Object.values(LanguageEnum).join(' | ') } })
  @query((ListParams as any).swaggerDocument)
  @query((GetTopCashbackCustomersParams as any).swaggerDocument)

  static async controller(context: Context): Promise<void> {
    let params: GetTopCashbackCustomersParams;
    let listParams: ListParams;
    try {
      listParams = await new ListParams(context.request.query).validate();
      params = await new GetTopCashbackCustomersParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const redisClient = await Redis.getInstance();

      let cacheKey =`${process.env.NODE_ENV}:stats:top-cashback-earned-customers:`+`page:${listParams.page}:size:${listParams.size}:lang:${context.lang}:`;
      const cacheData = await redisClient.get(cacheKey)
      let response: any;
      const matchStage: any = {};

      if (params.store) {

        cacheKey += `store:${params.store}:`;
        
        matchStage.store = new Types.ObjectId(params.store);
      }

      if(cacheData) {
        response = JSON.parse(cacheData)
      } else {
      const total = await Repository.UserCashback().countDocumentsByFilter(matchStage);
      const users = await Repository.UserCashback().list(
        { page: listParams.page, size: listParams.size },
        matchStage,
        { cashbackAmount: -1 })

      const result = await Promise.all(users.map(async (customer) => {
        const userEntity = await Repository.Users().getById(customer.getUser() as Types.ObjectId)
        return {
          id: customer.getId(),
          firstName: userEntity?.getUserInfo()?.getFirstname() ?? "",
          lastName: userEntity?.getUserInfo()?.getLastname() ?? "",
          phoneNumber: userEntity?.getPhoneNumber(),
          avatar: userEntity?.getUserInfo()?.getAvatar(),
          cashbackAmount: customer.getCashbackAmount(),
        }
      }))
      response = {
        total,
        items: result
      }
      await redisClient.set(cacheKey, JSON.stringify(response), 24 * 60 * 60);
    }
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
