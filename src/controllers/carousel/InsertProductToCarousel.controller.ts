import { Context } from 'koa';
import { ProductIdsParams, IdParams } from '../../infrastructure';
import { BaseError, CarouselProductEntity, NotFoundError, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';

@prefix('/carousel')
export default class InsertProductToCarouselController {
  @request('post', '/insert-product/{carouselId}')
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
    // try {
    //   const carousel = await Repository.Carousels().getById(new Types.ObjectId(idParams.id));
    //   if (!carousel) {
    //     throw new NotFoundError('Carousel');
    //   }
    //   const productIds = params.products?.map(id => new Types.ObjectId(id));
    //   const products = await Repository.Products().list(
    //     { page: 1, size: 1000 },
    //     { _id: { $in: productIds } }
    //   );
    //   if (products.length !== params.products.length) {
    //     const foundIds = products.map(p => p.getId().toString());
    //     const missingIds = productIds.filter(id => !foundIds.includes(id.toString()));
    //     throw new NotFoundError(`Products ${missingIds.join(', ')}`);
    //   }

    //   for (const product of products) {
    //     if (!product.getIsPreOrder() && product.getCount() < product.getMinimumCount()) {
    //       throw new BaseError('Product is out of stock', {
    //         en: `Product ${product.getId()} is out of stock`,
    //         ru: `Товар ${product.getId()} закончился на складе`,
    //         uz: `Mahsulot ${product.getId()} omborda tugadi`
    //       }, 400);
    //     }
    //   }
    //   const carouselProducts = carousel.getProducts()
    //   let position = carouselProducts.length;
    //   params.products?.map((product) => {
    //     const carouselProduct = new CarouselProductEntity()
    //     carouselProduct.buildProduct(new Types.ObjectId(product))
    //     carouselProduct.buildPosition(position)
    //     carousel.buildProduct(carouselProduct.convertToSchema())
    //     position++
    //   });
    //   await Repository.Carousels().update(carousel);
      
    //   await InvalidateRedisCache.execute('carousel:list:');
    //   await InvalidateRedisCache.execute('carousel:count');

    //   return context.send.data({ updated: true });
    // } catch (error) {
    //   return context.send.error(error);
    // }
    try {
      const carousel = await Repository.Carousels().getById(new Types.ObjectId(idParams.id));
      if (!carousel) throw new NotFoundError('Carousel');
    
      const productIds = (params.products ?? []).map(id => new Types.ObjectId(id));
    
      const products = await Repository.Products().list(
        { page: 1, size: 1000 },
        { _id: { $in: productIds } }
      );
    
      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map(p => p.getId().toString()));
        const missingIds = productIds.filter(id => !foundIds.has(id.toString()));
        throw new NotFoundError(`Products ${missingIds.join(', ')}`);
      }
    
      for (const product of products) {
        if (!product.getIsPreOrder() && product.getCount() <= product.getMinimumCount()) {
          throw new BaseError(
            'Product is out of stock',
            {
              en: `Product ${product.getId()} is out of stock`,
              ru: `Товар ${product.getId()} закончился на складе`,
              uz: `Mahsulot ${product.getId()} omborda tugadi`
            },
            400
          );
        }
      }
    
      let position = carousel.getProducts().length;
    
      for (const productId of productIds) {
        const cp = new CarouselProductEntity();
        cp.buildProduct(productId);
        cp.buildPosition(position++);
        
        carousel.buildProduct(cp.convertToSchema());
      }
    
      await Repository.Carousels().update(carousel);

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:${carousel.getId().toString()}:`);  
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`); 
    
      return context.send.data({ updated: true });
    
    } catch (error) {
      return context.send.error(error);
    }
  }
}
