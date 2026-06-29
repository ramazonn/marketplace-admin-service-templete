import { Context } from 'koa';
import { UpdateMultipleProductStatusParams } from '../../infrastructure';
import {  Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';

@prefix('/product')
export default class UpdateMultipleProductStatusController {
  @request('post', '/status/bulk')
  @summary('Update multiple products status')
  @security([])
  @tags(['Product'])
  @body((UpdateMultipleProductStatusParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateMultipleProductStatusParams;
    try {
      params = await new UpdateMultipleProductStatusParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const productIds = params.productIds?.map(id => new Types.ObjectId(id));  
      await Repository.Products().updateMany({ _id: { $in: productIds } }, { status: params.status });

      await InvalidateRedisCache.execute('special-event:list:');  
      await InvalidateRedisCache.execute('special-event:count');
      for (const productId of productIds) {
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${productId.toString()}:`);  
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${productId.toString()}:`); 
      }

      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
