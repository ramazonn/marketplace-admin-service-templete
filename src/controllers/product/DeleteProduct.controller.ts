import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, CarouselProductEntity, NotFoundError, ProductEntity, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService, StoreStatsQueueService } from '../../services';

@prefix('/product')
export default class DeleteProductController {
  @request('delete', '/{productId}')
  @summary('Product delete')
  @security([])
  @tags(['Product'])
  @path({ productId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.productId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const product = await Repository.Products().getById(new Types.ObjectId(params.id));
      if (!product) {
        throw new NotFoundError('Product');
      }

      const before = await Repository.Products().findOneRaw(new Types.ObjectId(params.id));

      product.buildStatus(ProductStatusEnum.DELETED);
      await Repository.Products().update(product);
      await Repository.UserViewedProducts().deleteByProduct(product.getId());

      await StoreStatsQueueService.getInstance().onProductDeleted(product.convertToSchema().store._id.toString())

      // Remove product from special event
      const spcialEventProducts = await Repository.SpecialEventProducts().findByProductId(
        new Types.ObjectId(params.id),
      );

      //o'chirib yuborish kerak 
      await InvalidateRedisCache.execute('special-event:list:');
      await InvalidateRedisCache.execute('special-event:count');

      if (spcialEventProducts.length > 0) {
        for (const spcialEventProduct of spcialEventProducts) {
          const event: any = spcialEventProduct.getSpecialEvent();
          const specialEventId = event?.getId ? event.getId().toString() : event.toString();
          await Repository.SpecialEventProducts().deleteById(spcialEventProduct.getId());
          await InvalidateRedisCache.execute(
            `${process.env.NODE_ENV}:special-event:product:${specialEventId}:${product.getId().toString()}:`,
          );
        }
      }

      // Remove product from carousel
      const carousels = await Repository.Carousels().list({}, {});
      // console.log("++", carousels);

      if (carousels.length > 0) {
        for (const carousel of carousels) {
          let carouselProducts = carousel.getProducts() ?? [];

          const getProductId = (item: CarouselProductEntity): string | null => {
            const product = item?.getProduct();

            if (!product) {
              return null;
            }

            if (product instanceof ProductEntity) {
              return product.getId()?.toString() ?? null;
            }

            return product.toString();
          };

          const hasProduct = carouselProducts.some((item) => getProductId(item) === params.id);

          if (!hasProduct) {
            continue;
          }

          carouselProducts = carouselProducts.filter((item) => getProductId(item) !== params.id);

          carousel.clearProducts();

          carouselProducts.forEach((item, index) => {
            const productId = getProductId(item);

            if (!productId) {
              return;
            }

            const carouselProduct = new CarouselProductEntity();
            carouselProduct.buildProduct(new Types.ObjectId(productId));
            carouselProduct.buildPosition(index);
            carousel.buildProduct(carouselProduct.convertToSchema());
          });

          await Repository.Carousels().update(carousel);

          await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:list:basic:`);
          await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:carousel:count:`);
          await InvalidateRedisCache.execute(
            `${process.env.NODE_ENV}:carousel:${carousel.getId().toString()}:`,
          );
        }
      }

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${product.getId().toString()}:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${product.getId().toString()}:`);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Product',
        resourceId: product.getId(),
        before,
      });

      return context.send.data({ deleted: true });
    } catch (error) {

      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Product',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
