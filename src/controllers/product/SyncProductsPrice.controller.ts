import { Context } from 'koa';
import { ProductStatusEnum, Redis, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { SAPService } from '../../services';
import { Types } from 'mongoose';
import { SyncProductSapParams } from '../../infrastructure';
import { LogisticPriceCalculatorService } from '../../utils';

@prefix('/product')
export default class SyncProductsPriceController {
  @request('post', '/sync-price')
  @summary('Product sync price')
  @security([])
  @tags(['Product'])
  @body((SyncProductSapParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SyncProductSapParams;
    const redisClient = await Redis.getInstance();
    let syncSucceeded = false

    const updatedProducts: Array<{
      productId: Types.ObjectId;
      productName: string;
      itemName: string;
      itemCode: string;
      warehouseCode: string;
      previousStatus: string;
      newStatus: string;
      previousPrice: number;
      newPrice: number;
      previousLogisticPrice: number;
      newLogisticPrice: number | null;
      storeUsdRate: number;
    }> = [];

    const notFoundProducts: Array<{
      productId: Types.ObjectId;
      productName: string;
      itemCode: string;
      warehouseCode: string;
    }> = [];

    const failedProducts: Array<{
      productId: Types.ObjectId;
      productName: string;
      itemCode: string | null;
      reason: string;
    }> = [];

    try {
      params = await new SyncProductSapParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {

      let page = 1;
      const batchSize = 50;
      const start = Date.now();

      const filter: any = {
        status: {
          $nin: [
            ProductStatusEnum.DELETED,
            ProductStatusEnum.ARCHIVED
          ]
        },
        syncwithSap: true,
      };

      if (params.products?.length) {
        filter._id = { $in: params.products.map((id) => new Types.ObjectId(id)) };
      }

      while (true) {
        console.log('page-', page, (Date.now() - start) / 1000);

        const products = await Repository.Products().list(
          { page: page, size: batchSize },
          filter
        );

        console.log('product length', products.length);

        if (products.length === 0) break;

        let itemCodesParam = '';
        products.forEach((p) => {
          if (p.getItemCode()) itemCodesParam += `itemCode=${p.getItemCode()}&`
        });

        if (itemCodesParam.length == 0) {
          page += 1;
          continue;
        };

        const sapResponseRata = await SAPService.getInstance().getProductsWithItemCodes({ itemCodesParam });
        const sapProducts = sapResponseRata?.items || [];
        const sapProductsMap = new Map(
          sapProducts.map((product: { ItemCode: string }) => [product.ItemCode, product])
        );

        console.log('sapProducts', (Date.now() - start) / 1000);

        const updates = products
          .map(async (product) => {
            let newStatus = ProductStatusEnum.IN_STOCK;
            const previousStatus = product.getStatus();
            const itemCode = product.getItemCode();
            const productId = product.getId();
            const productName = product.getName().getRu();
            const isGetFromEshop = product.getCountFromEshop();
            const warehouseCode = isGetFromEshop ? 'eshop' : '01';
            const previousPrice = product.getProductInfo().getCurrentPrice();
            const previousLogisticPrice = product.getProductInfo().getLogisticPrice() ?? 0;

            const sapProduct: any = sapProductsMap.get(itemCode);
            console.log("sapProduct", sapProduct);

            if (!sapProduct) {
              notFoundProducts.push({
                productId: productId ?? null,
                productName: productName ?? null,
                itemCode: itemCode ?? null,
                warehouseCode: warehouseCode ?? null,
              });
              return null;
            }



            const itemName = sapProduct.ItemName;

            try {
              const weight = Number(sapProduct.Weight || 0);

              if (sapProduct.IsFrozen == 'Y') {
                console.log('yes frozen');
                newStatus = ProductStatusEnum.ARCHIVED;
              }

              const store = await Repository.Stores().getById(product.getStore() as Types.ObjectId);
              const storeUsdRate = store?.getUsdRate() ?? 1;

              const productInfo = product.getProductInfo();
              productInfo.buildWeight(weight)

              let newPrice = Math.round(sapProduct.Price * storeUsdRate);
              let newLogisticPrice: number | null = null;

              if (weight > 0) {
                newLogisticPrice = LogisticPriceCalculatorService.calculate(newPrice, weight);
              }
              productInfo.buildBasePrice(newPrice);
              productInfo.buildCurrentPrice(newPrice + newLogisticPrice);
              productInfo.buildLogisticPrice(newLogisticPrice);
              product.buildProductInfo(productInfo.convertToSchema());

              product.buildStatus(newStatus);

              updatedProducts.push({
                productId: productId ?? null,
                productName: productName ?? null,
                itemCode: itemCode ?? null,
                itemName: itemName ?? null,
                warehouseCode: warehouseCode ?? null,
                previousStatus: previousStatus ?? null,
                newStatus: newStatus ?? null,
                newPrice: newPrice,
                previousPrice: previousPrice ?? null,
                newLogisticPrice: newLogisticPrice ?? null,
                previousLogisticPrice: previousLogisticPrice ?? null,
                storeUsdRate: storeUsdRate ?? null,
              });

              return Repository.Products().update(product);
            } catch (error: any) {
              failedProducts.push({
                productId: productId ?? null,
                productName: productName ?? null,
                itemCode: itemCode ?? null,
                reason: error.message ?? 'Unknown error',
              });
              return null;
            }
          })
          .filter(Boolean);

        console.log('bef promise all', (Date.now() - start) / 1000);

        await Promise.all(updates);

        console.log('aft promise all', (Date.now() - start) / 1000);

        page += 1;
      }
      syncSucceeded = true;

      return context.send.data({
        updated: true,
        updatedCount: updatedProducts.length,
        updatedProducts,
        notFoundCount: notFoundProducts.length,
        notFoundProducts,
        failedCount: failedProducts.length,
        failedProducts,
      });
    } catch (error) {
      return context.send.error(error);
    }
    finally {
      // derive IDs from result — no separate accumulator array
      if (syncSucceeded && updatedProducts.length > 0) {
        const env = process.env.NODE_ENV;

        // all patterns handed off to one single SCAN pass
        const patterns = updatedProducts.flatMap(({ productId }) => [
          `${env}:product:basic:${productId?.toString()}:`,
          `${env}:product:detail:${productId?.toString()}:`,
        ]);

        await redisClient.deleteProductCachesByPatterns(patterns);
      }
    }
  }
}