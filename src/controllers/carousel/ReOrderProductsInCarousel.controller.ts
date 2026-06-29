import { Context } from 'koa';
import { ProductIdsParams, IdParams } from '../../infrastructure';
import { CarouselProductEntity, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';

@prefix('/carousel')
export default class ReOrderProductsInCarousel {
  @request('post', '/re-order-products/{carouselId}')
  @summary('Insert product to Carousel')
  @security([])
  @tags(['Carousel'])
  @path({ carouselId: { type: 'string', required: true } })
  @body((ProductIdsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: ProductIdsParams;
    try {
      idParams = await new IdParams({ id: context.params.carouselId }).validate();
      params = await new ProductIdsParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const carousel = await Repository.Carousels().getById(new Types.ObjectId(idParams.id));
      if (!carousel) {
        throw new NotFoundError('Carousel');
      }
      // params.products?.map((product) => carousel.buildProduct(new Types.ObjectId(product)));
      carousel.clearProducts()
      let position = 0;
      params.products?.map((product) => {
        const carouselProduct = new CarouselProductEntity()
        carouselProduct.buildProduct(new Types.ObjectId(product))
        carouselProduct.buildPosition(position)
        carousel.buildProduct(carouselProduct.convertToSchema())
        position++
      });
      await Repository.Carousels().update(carousel);
      
      await InvalidateRedisCache.execute('carousel:list:');  
      await InvalidateRedisCache.execute('carousel:count'); 

      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
