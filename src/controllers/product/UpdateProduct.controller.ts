import { Context } from 'koa';
import { IdParams, UpdateProductParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, PreOrderShippingInfoEntity, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/product')
export default class UpdateProductController {
  @request('put', '/{productId}')
  @summary('Product update')
  @security([])
  @tags(['Product'])
  @path({ productId: { type: 'string', required: true } })
  @body((UpdateProductParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: UpdateProductParams;
    let idParams: IdParams;
    try {
      params = await new UpdateProductParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.productId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const product = await Repository.Products().getById(new Types.ObjectId(idParams.id));
      const beforeData = await Repository.Products().findOneRaw(new Types.ObjectId(idParams.id))
      if (!product) {
        throw new NotFoundError('Product');
      }
      if (params.name) {
        product.buildName(params.name);
      }

      if (params.category) {
        product.buildCategory(new Types.ObjectId(params.category));
      }

      if (params.store) {
        product.buildStore(new Types.ObjectId(params.store));
      }

      if (params.attachments) {
        product.buildAttachments(params.attachments);
      }

      if (params.videos) {
        product.buildVideos(params.videos);
      }

      if (params.itemCode) {
        product.buildItemCode(params.itemCode);
      }

      if (params.categoryPath) {
        product.buildCategoryPath(params.categoryPath);
      }

      const productInfo = product.getProductInfo();

      if (params.brand) {
        productInfo.buildBrand(new Types.ObjectId(params.brand));
      }

      if (params.model) {
        productInfo.buildModel(new Types.ObjectId(params.model));
      }

      if (params.country) {
        productInfo.buildCountry(params.country);
      }

      if (params.description) {
        productInfo.buildDescription(params.description);
      }

      if (params.price) {
        productInfo.buildCurrentPrice(params.price);
      }

      if (params.basePrice) {
        productInfo.buildBasePrice(params.basePrice);
      }

      if (params.discount_percent !== undefined) {
        productInfo.buildDiscountPercent(params.discount_percent);
      }

      if (params.discount_price !== undefined) {
        productInfo.buildDiscountPrice(params.discount_price);
      }

      if (params.logisticPrice !== undefined) {
        productInfo.buildLogisticPrice(params.logisticPrice);
      }

      if (params.ikpu) {
        productInfo.buildIKPU(params.ikpu);
      }

      if (params.weight !== undefined) {
        productInfo.buildWeight(params.weight);
      }

      if (params.volume !== undefined) {
        productInfo.buildVolume(params.volume);
      }

      if (params.packageCode) {
        productInfo.buildPackageCode(params.packageCode);
      }

      if (params.sku) {
        productInfo.buildSKUCode(params.sku);
      }

      if (params.guaranty) {
        productInfo.buildGuaranty(params.guaranty);
      }

      if (params.flags) {
        productInfo.buildFlags(params.flags?.map((flag) => new Types.ObjectId(flag)));
      }

      if (params.characteristics) {
        productInfo.buildCharacteristics(params.characteristics);
      }

      if (params.advantages) {
        productInfo.buildAdvantages(params.advantages);
      }

      if (params.short_description) {
        productInfo.buildShortDescription(params.short_description);
      }

      if (params.status) {
        product.buildStatus(params.status);
      }

      if (params.minimumCount !== undefined) {
        product.buildMinimumCount(params.minimumCount);
      }

      if (params.getCountFromEshop !== undefined) {
        product.buildGetCountFromEshop(params.getCountFromEshop);
      }
      if (params.cashbackPercent !== undefined) {
        product.buildCashbackPercent(params.cashbackPercent)
      }

      const isPreOrder = params.isPreOrder ?? product.getIsPreOrder() ?? false;
      if (params.count !== undefined) {
        product.buildCount(params.count);
        // Update status(based on count) if product is not pre-order
        if (!isPreOrder) {
          let newStatus = ProductStatusEnum.IN_STOCK;
          const minimumCount = params.minimumCount ? params.minimumCount : product.getMinimumCount() ?? 0

          if (params.count <= 10 && params.count > minimumCount) {
            newStatus = ProductStatusEnum.LOW_STOCK
          } else
            if (params.count <= minimumCount) {
              newStatus = ProductStatusEnum.OUT_OF_STOCK
            }
          product.buildStatus(newStatus)
        }
      }


      if (params.isPreOrder !== undefined) {
        product.buildIsPreOrder(params.isPreOrder)
        if (params.isPreOrder) {
          product.buildStatus(ProductStatusEnum.IN_STOCK);
        }
      }

      if (params.preOrderShippingInfo) {
        const preOrderShippingInfo = new PreOrderShippingInfoEntity()
          .buildShippingDaysFrom(params.preOrderShippingInfo.shippingDaysFrom)
          .buildShippingDaysTo(params.preOrderShippingInfo.shippingDaysTo);
        product.buildPreOrderShippingInfo(preOrderShippingInfo.convertToSchema())
      }

      if (params.searchTags?.length && params.searchTags.length > 0) {
        product.buildSearchTags(params.searchTags);
      }

      if (params.syncwithSap !== undefined) {
        product.buildSyncwithSap(params.syncwithSap);
      }

      product.buildProductInfo(productInfo.convertToSchema());

      const updatedProduct = await Repository.Products().update(product);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Product',
        resourceId: product.getId(),
        before: beforeData as unknown as Record<string, unknown>,
        after: updatedProduct.convertToSchema() as unknown as Record<string, unknown>,
      });

      //O"CHIRIB YUBORISH KERAK
      await InvalidateRedisCache.execute('special-event:list:');
      await InvalidateRedisCache.execute('special-event:count');



      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${product.getId().toString()}:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${product.getId().toString()}:`);

      const productId = product.getId().toString();

      const specialEventProducts = await Repository.SpecialEventProducts().findByProductId(
        new Types.ObjectId(productId),
      );

      for (const specialEventProduct of specialEventProducts) {
        const event: any = specialEventProduct.getSpecialEvent();
        const specialEventId = event?.getId ? event.getId().toString() : event.toString();

        await InvalidateRedisCache.execute(
          `${process.env.NODE_ENV}:special-event:product:${specialEventId}:${productId}:`,
        );
      }

      const carousels = await Repository.Carousels().list({}, {});

      for (const carousel of carousels) {
        const hasProduct = carousel.getProducts().some((item) => {
          const p = item.getProduct();
          const itemProductId = p instanceof Types.ObjectId ? p.toString() : p?.getId?.()?.toString?.();
          return itemProductId === productId;
        });
        if (hasProduct) {
          await InvalidateRedisCache.execute(
            `${process.env.NODE_ENV}:carousel:${carousel.getId().toString()}:`,
          );
        }
      }

      return context.send.data({ updated: true, id: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Product',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
