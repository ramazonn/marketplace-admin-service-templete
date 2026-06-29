import { Context } from 'koa';
import { AddProductParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, PreOrderShippingInfoEntity, ProductEntity, ProductInfoEntity, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService, StoreStatsQueueService } from '../../services';

@prefix('/product')
export default class AddProductController {
  @request('post', '/add')
  @summary('Product add')
  @security([])
  @tags(['Product'])
  @body((AddProductParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddProductParams;
    try {
      params = await new AddProductParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const product = new ProductEntity()
        .buildName(params.name)
        .buildCategory(new Types.ObjectId(params.category))
        .buildCount(0);

      if (params.store) {
        await StoreStatsQueueService.getInstance().onProductCreated(params.store);
        product.buildStore(new Types.ObjectId(params.store));
      }
      if (params.itemCode) {
        product.buildItemCode(params.itemCode);
      }
      if (params.attachments) {
        product.buildAttachments(params.attachments);
      }
      if (params.videos) {
        product.buildVideos(params.videos);
      }
      if (params.categoryPath) {
        product.buildCategoryPath(params.categoryPath);
      }
      const info = new ProductInfoEntity();

      if (params.brand) {
        info.buildBrand(new Types.ObjectId(params.brand));
      }
      if (params.model) {
        info.buildModel(new Types.ObjectId(params.model));
      }
      if (params.country) {
        info.buildCountry(params.country);
      }
      if (params.description) {
        info.buildDescription(params.description);
      }
      if (params.price) {
        info.buildCurrentPrice(params.price);
      }
      if (params.basePrice) {
        info.buildBasePrice(params.basePrice);
      }
      if (params.discount_percent) {
        info.buildDiscountPercent(params.discount_percent);
      }
      if (params.discount_price) {
        info.buildDiscountPrice(params.discount_price);
      }
      if (params.logisticPrice !== undefined) {
        info.buildLogisticPrice(params.logisticPrice);
      }
      if (params.ikpu) {
        info.buildIKPU(params.ikpu);
      }
      if (params.packageCode) {
        info.buildPackageCode(params.packageCode);
      }
      if (params.weight !== undefined) {
        info.buildWeight(params.weight);
      }
      if (params.volume !== undefined) {
        info.buildVolume(params.volume);
      }
      if (params.sku) {
        info.buildSKUCode(params.sku);
      }
      if (params.guaranty) {
        info.buildGuaranty(params.guaranty);
      }
      if (params.characteristics) {
        info.buildCharacteristics(params.characteristics);
      }
      if (params.advantages) {
        info.buildAdvantages(params.advantages);
      }
      if (params.short_description) {
        info.buildShortDescription(params.short_description);
      }
      if (params.flags) {
        info.buildFlags(params.flags.map((flag) => new Types.ObjectId(flag)));
      }
      if (params.minimumCount !== undefined) {
        product.buildMinimumCount(params.minimumCount)
      }
      if (params.cashbackPercent !== undefined) {
        product.buildCashbackPercent(params.cashbackPercent)
      }

      if (params.isPreOrder !== undefined) {
        product.buildIsPreOrder(params.isPreOrder)
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

      product.buildProductInfo(info.convertToSchema());
      const created = await Repository.Products().create(product);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Product',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Product',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
