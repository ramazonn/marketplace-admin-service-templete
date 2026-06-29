import { Context } from 'koa';
import { IdParams, InsertProductToSpecialEventParams } from '../../infrastructure';
import {
  ActionLogFailureReasonEnum,
  ActionTypeEnum,
  BaseError,
  ErrorCodeEnum,
  NotFoundError,
  Repository,
  SpecialEventProductEntity,
} from '@ubaytools/core';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/special-event')
export default class InsertProductToSpecialEventController {
  @request('post', '/insert-product/{specialEventId}')
  @summary('Insert Product to Special Event')
  @security([])
  @tags(['Special Event'])
  @path({ specialEventId: { type: 'string', required: true } })
  @body((InsertProductToSpecialEventParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: InsertProductToSpecialEventParams;
    let idParams: IdParams;
    try {
      params = await new InsertProductToSpecialEventParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.specialEventId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const specialEvent = await Repository.SpecialEvents().getById(new Types.ObjectId(idParams.id));
      if (!specialEvent) {
        throw new NotFoundError('Special Event');
      }
      const before = await Repository.SpecialEvents().findOneRaw(new Types.ObjectId(idParams.id));

      const productIds = params.products.map((p) => new Types.ObjectId(p.productId));
      const products = await Repository.Products().list({ page: 1, size: 1000 }, { _id: { $in: productIds } });
      // Validate products
      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.getId().toString());
        const missingIds = productIds.filter((id) => !foundIds.includes(id.toString()));
        throw new NotFoundError(`Products ${missingIds.join(', ')}`);
      }
      // Validate stock
      for (const product of products) {
        if (!product.getIsPreOrder() && product.getCount() <= product.getMinimumCount()) {
          throw new BaseError(
            'Product is out of stock',
            {
              en: `Product ${product.getId()} is out of stock`,
              ru: `Товар ${product.getId()} закончился на складе`,
              uz: `Mahsulot ${product.getId()} omborda tugadi`,
            },
            400,
          );
        }
        const specialEventProducts = await Repository.SpecialEventProducts().findByProductId(product.getId());
        if (specialEventProducts.length > 0) {
          throw new BaseError(
            'Product already in special event',
            {
              en: `Product ${product.getId()} already in special event`,
              ru: `Продукт ${product.getId()} уже был добавлен в специальные акции`,
              uz: `Mahsulot ${product.getId()} allaqachon maxsus aksiyalarga qo'shilgan`,
            },
            ErrorCodeEnum.BAD_REQUEST,
          );
        }
      }
      // Add product to the special event
      for (const product of params.products) {
        const spcialEventProduct = await Repository.SpecialEventProducts().findByProductAndSpecialEvent(
          new Types.ObjectId(product.productId),
          new Types.ObjectId(idParams.id),
        );
        if (spcialEventProduct) {
          spcialEventProduct
            .buildProductLimit(product.productLimit)
            .buildDiscountPercent(product.discountPercent)
            .buildDiscountPrice(product.discountPrice)
            .buildLimitForSale(product.limitForSale);
          await Repository.SpecialEventProducts().update(spcialEventProduct);
          await ActionLogService.logSuccess({
            context,
            action: ActionTypeEnum.UPDATE,
            resource: 'Special event',
            resourceId: new Types.ObjectId(idParams.id),
            before: before as unknown as Record<string, unknown>,
            after: spcialEventProduct.convertToSchema() as unknown as Record<string, unknown>,
          });
          console.log('exist', spcialEventProduct);
        } else {
          let newSpecialEventProduct = new SpecialEventProductEntity()
            .buildProduct(new Types.ObjectId(product.productId))
            .buildSpecialEvent(new Types.ObjectId(idParams.id))
            .buildProductLimit(product.productLimit)
            .buildDiscountPercent(product.discountPercent)
            .buildDiscountPrice(product.discountPrice)
            .buildLimitForSale(product.limitForSale);
          newSpecialEventProduct = await Repository.SpecialEventProducts().create(newSpecialEventProduct);
          await ActionLogService.logSuccess({
            context,
            action: ActionTypeEnum.CREATE,
            resource: 'Special Event',
            resourceId: newSpecialEventProduct.getId(),
            after: newSpecialEventProduct.convertToSchema() as unknown as Record<string, unknown>,
          });
          console.log('new', newSpecialEventProduct);

          specialEvent.buildSpecialEventProduct(newSpecialEventProduct.convertToSchema());
        }
        console.log('product', product.productId.toString(), `${process.env.NODE_ENV}:product:basic:${product.productId.toString()}:`);
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${product.productId.toString()}:`);
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${product.productId.toString()}:`);
      }
      await Repository.SpecialEvents().update(specialEvent);

      await InvalidateRedisCache.execute('special-event:list:');
      await InvalidateRedisCache.execute('special-event:count');

      await InvalidateRedisCache.execute('carousel:list:');
      await InvalidateRedisCache.execute('carousel:count');

      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:${idParams.id}:`);

      return context.send.data({ added: true, updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Special Event',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
