import { Context } from 'koa';
import { ProductStatusEnum, Redis, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { SAPService } from '../../services';
import { Types } from 'mongoose';
import { SyncProductSapParams } from '../../infrastructure';

@prefix('/product')
export default class SyncProductsCountController {
  @request('post', '/sync-count')
  @summary('Product sync count')
  @security([])
  @tags(['Product'])
  @body((SyncProductSapParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SyncProductSapParams;
    const redisClient = await Redis.getInstance();
    let syncSucceeded = true;

    const updatedProducts: Array<{
      productId: Types.ObjectId;
      productName: string;
      itemCode: string;
      itemName: string;
      warehouseCode: string;
      previousCount: number;
      newCount: number;
      previousStatus: string;
      newStatus: string;
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
      const barchSize = 50;
      const start = Date.now();

      const filter: any = {
        status: {
          $nin: [
            ProductStatusEnum.DELETED,
            ProductStatusEnum.ARCHIVED
          ],
        },
        syncwithSap: true,
      };

      if (params.products?.length) {
        filter._id = { $in: params.products.map((id) => new Types.ObjectId(id)) };
      }

      while (true) {
        const products = await Repository.Products().list(
          { page, size: barchSize },
          filter
        );

        if (products.length === 0) break;

        let itemCodesParam = '';
        products.forEach((p) => {
          if (p.getItemCode()) itemCodesParam += `itemCode=${p.getItemCode()}&`
        });

        if (itemCodesParam.length == 0) {
          page += 1;
          continue;
        };

        const sapResponseData = await SAPService.getInstance().getProductsWithItemCodes({ itemCodesParam });
        const sapProducts = sapResponseData?.items || [];

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
            const previousCount = product.getCount();
            const sapProduct: any = sapProductsMap.get(itemCode);

            if (!sapProduct) {
              notFoundProducts.push({
                productId: productId ?? null,
                productName: productName ?? null,
                itemCode: itemCode ?? null,
                warehouseCode: warehouseCode ?? null,
              });
              return null;
            }

            if (sapProduct.ItemCode == '2-3000') {
              console.log('---++0', sapProduct);
            }

            const itemName = sapProduct.ItemName;

            try {
              const stock = isGetFromEshop ? sapProduct.EshopInStock : sapProduct.InStock;
              const committed = isGetFromEshop ? sapProduct.EshopCommitted : sapProduct.Committed;
              const count = Math.max(0, stock - committed);
              const minimumCount = product.getMinimumCount();

              if (sapProduct.IsFrozen == 'Y') {
                console.log('yes frozen');
                newStatus = ProductStatusEnum.ARCHIVED;
              } else {
                if (count <= 10 && count > minimumCount) {
                  newStatus = ProductStatusEnum.LOW_STOCK;
                } else if (count <= minimumCount) {
                  newStatus = ProductStatusEnum.OUT_OF_STOCK;
                }
              }

              product.buildCount(count);
              product.buildStatus(newStatus);

              updatedProducts.push({
                productId: productId ?? null,
                productName: productName ?? null,
                itemCode: itemCode ?? null,
                itemName: itemName ?? null,
                warehouseCode: warehouseCode ?? null,
                previousStatus: previousStatus ?? null,
                newStatus: newStatus ?? null,
                previousCount: previousCount ?? null,
                newCount: count ?? null,
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

        console.log('bef promisea all', (Date.now() - start) / 1000);

        await Promise.all(updates);

        console.log('aft promisea all', (Date.now() - start) / 1000);

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