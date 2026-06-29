import { Context } from 'koa';
import { ProductIdsParams, IdParams } from '../../infrastructure';
import { CarouselProductEntity, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';

@prefix('/carousel')
export default class RemoveProductFromCarouselController {
  @request('post', '/remove-product/{carouselId}')
  @summary('Remove product from carousel')
  @security([])
  @tags(['Carousel'])
  @path({ carouselId: { type: 'string', required: true } })
  @body((ProductIdsParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ProductIdsParams;
    let idParams: IdParams;
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
      let carouselProducts = carousel.getProducts();
       carouselProducts = carouselProducts.filter((item) => {
        let product = item.getProduct()
        if (product instanceof Object && !(product instanceof Types.ObjectId)) {
          product = product.getId();
        }
        return !params.products.includes(product.toString());
      });
      let productIds = carouselProducts.map((item) => item.getProduct() as Types.ObjectId);

      carousel.clearProducts();
      // products.forEach((product) => carousel.buildProduct(product as Types.ObjectId));
      let position = 0;
      productIds?.map((product) => {
        const carouselProduct = new CarouselProductEntity()
        carouselProduct.buildProduct(new Types.ObjectId(product))
        carouselProduct.buildPosition(position)
        carousel.buildProduct(carouselProduct.convertToSchema())
        position++
      });

      await Repository.Carousels().update(carousel);
      
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:${carousel.getId().toString()}:`);  
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`);  

      return context.send.data({ updated: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
