import { Context } from 'koa';
import { ProductIdsParams, IdParams } from '../../infrastructure';
import { CarouselProductEntity, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';

@prefix('/special-event')
export default class ReOrderSpecialEventProductsController {
  @request('post', '/re-order-products/{specialEventId}')
  @summary('Re-order special event products')
  @security([])
  @tags(['Special Event'])
  @path({ specialEventId: { type: 'string', required: true } })
  @body((ProductIdsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: ProductIdsParams;
    try {
      idParams = await new IdParams({ id: context.params.specialEventId }).validate();
      params = await new ProductIdsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const specialEvent = await Repository.SpecialEvents().getById(new Types.ObjectId(idParams.id));
      if (!specialEvent) {
        throw new NotFoundError('Special Event');
      }
      specialEvent.clearProducts()
      for (let productId of params.products) {
          const specialEventProduct = await Repository.SpecialEventProducts().findByProductAndSpecialEvent(new Types.ObjectId(productId), new Types.ObjectId(idParams.id));
          specialEvent.buildSpecialEventProduct(specialEventProduct.convertToSchema())        
      }
      await Repository.SpecialEvents().update(specialEvent);
      
      await InvalidateRedisCache.execute('special-event:list:');  
      await InvalidateRedisCache.execute('special-event:count'); 
      
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:${idParams.id}:`);

      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
