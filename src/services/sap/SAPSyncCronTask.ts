import { BaseCaseParamsInterface, ProductEntity, ProductStatusEnum, Redis, Repository, sliceLogParams } from '@ubaytools/core';
import { SAPService } from './SAP.service';
import { Types } from 'mongoose';
import { TelegramBotMessageSender } from '../telegram-bot/TelegramBotMessageSender';
import { LogisticPriceCalculatorService } from '../../utils';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { CronReportQueueService } from '../order-queue/SAPCronQueue.service';

export interface SAPSyncResult {
  updatedProducts: Array<{
    productId: Types.ObjectId;
    productName: string;
    itemCode: string;
    itemName: string;
    warehouseCode: string;
    previousCount: number;
    newCount: number;
    previousStatus: string;
    newStatus: string;
    previousPrice: number;
    newPrice: number | null;
    previousLogisticPrice: number;
    newLogisticPrice: number | null;
    storeUsdRate: number
  }>;
  notFoundProducts: Array<{
    productId: Types.ObjectId;
    productName: string;
    itemCode: string;
    warehouseCode: string
  }>;
  failedProducts: Array<{
    productId: Types.ObjectId;
    productName: string;
    itemCode: string | null;
    reason: string;
  }>;
  summary: {
    totalProcessed: number;
    updatedCount: number;
    notFoundCount: number;
    failedCount: number;
    duration: number;
  };
}

export class SAPSyncCronTask {
  /**
   * Main SAP sync task that can be called by cron
   */
  static async execute(params: BaseCaseParamsInterface<{}>): Promise<SAPSyncResult> {
    const redisClient = await Redis.getInstance();
    const lockKeyName = 'daily-product-sync-cron';
    let syncSucceeded = false; // replaces the mutable deleteProductsCache flag

    const lockAcquired = await redisClient.setLock(lockKeyName, 180);
    if (!lockAcquired) {
      console.log('daily product sync cron already started');
      return;
    }

    const { refId } = sliceLogParams(params);
    const startTime = Date.now();
    console.log(`[SAP-SYNC] Starting product synchronization (${refId})`);

    const result: SAPSyncResult = {
      updatedProducts: [],
      notFoundProducts: [],
      failedProducts: [],
      summary: {
        totalProcessed: 0,
        updatedCount: 0,
        notFoundCount: 0,
        failedCount: 0,
        duration: 0,
      },
    };

    try {
      let page = 1;
      const batchSize = 20;
      const start = Date.now();

      while (true) {
        console.log('page-', page, (Date.now() - start) / 1000);

        const products = await Repository.Products().list(
          { page, size: batchSize },
          {
            status: {
              $nin: [ProductStatusEnum.DELETED, ProductStatusEnum.ARCHIVED],
            },
          }
        );

        if (products.length === 0) break;

        let itemCodesParam = '';
        products.forEach((p) => {
          if (p.getItemCode()) itemCodesParam += `itemCode=${p.getItemCode()}&`;
        });

        if (!itemCodesParam) {
          page += 1;
          continue;
        }

        const sapResponseData = await SAPService.getInstance().getProductsWithItemCodes({ itemCodesParam });
        const sapProducts = sapResponseData?.items ?? [];
        const sapProductsMap = new Map(
          sapProducts.map((product: { ItemCode: string }) => [product.ItemCode, product])
        );

        const updates = products.map(async (product) => {
          let newStatus = ProductStatusEnum.IN_STOCK;
          const previousStatus = product.getStatus();
          const itemCode = product.getItemCode();
          const productId = product.getId();
          const productName = product.getName().getRu();
          const isGetFromEshop = product.getCountFromEshop();
          const warehouseCode = isGetFromEshop ? 'eshop' : '01';
          const previousPrice = product.getProductInfo().getCurrentPrice();
          const previousLogisticPrice = product.getProductInfo().getLogisticPrice() ?? 0;
          const previousCount = product.getCount();
          const sapProduct: any = sapProductsMap.get(itemCode);

          if (!sapProduct) {
            result.notFoundProducts.push({
              productId: productId ?? null,
              productName: productName ?? null,
              itemCode: itemCode ?? null,
              warehouseCode: warehouseCode ?? null,
            });
            return null;
          }

          const itemName = sapProduct.ItemName;
          try {
            const stock = isGetFromEshop ? sapProduct.EshopInStock : sapProduct.InStock;
            const committed = isGetFromEshop ? sapProduct.EshopCommitted : sapProduct.Committed;
            const count = Math.max(0, stock - committed);
            const weight = sapProduct.Weight;
            const volume = sapProduct.Volume;
            const minimumCount = product.getMinimumCount();

            if (sapProduct.IsFrozen === 'Y') {
              newStatus = ProductStatusEnum.ARCHIVED;
            } else if (count <= minimumCount) {
              newStatus = ProductStatusEnum.OUT_OF_STOCK;
            } else if (count <= 10) {
              newStatus = ProductStatusEnum.LOW_STOCK;
            }

            const store = await Repository.Stores().getById(product.getStore() as Types.ObjectId);
            const storeUsdRate = store?.getUsdRate() ?? 1;

            const productInfo = product.getProductInfo();
            productInfo.buildWeight(weight);
            productInfo.buildVolume(volume);

            product.buildCount(count);
            product.buildStatus(newStatus);

            const isSyncWithSap = product.getSyncwithSap?.() ?? false;
            let newPrice: number | null = null;
            let newLogisticPrice: number | null = null;

            if (isSyncWithSap) {
              newPrice = Math.round(sapProduct.Price * storeUsdRate);
              const w = Number(sapProduct.Weight || 0);
              if (w > 0) {
                newLogisticPrice = LogisticPriceCalculatorService.calculate(newPrice, w);
              }
              productInfo.buildBasePrice(newPrice);
              productInfo.buildCurrentPrice(newPrice + newLogisticPrice);
              productInfo.buildLogisticPrice(newLogisticPrice);
              product.buildProductInfo(productInfo.convertToSchema());
            }

            result.updatedProducts.push({
              productId: productId ?? null,
              productName: productName ?? null,
              itemCode: itemCode ?? null,
              itemName: itemName ?? null,
              warehouseCode: warehouseCode ?? null,
              previousStatus: previousStatus ?? null,
              newStatus: newStatus ?? null,
              previousCount: previousCount ?? null,
              newCount: count ?? null,
              newPrice,
              previousPrice: previousPrice ?? null,
              newLogisticPrice,
              previousLogisticPrice,
              storeUsdRate,
            });

            return Repository.Products().update(product);
          } catch (error: any) {
            result.failedProducts.push({
              productId: productId ?? null,
              productName: productName ?? null,
              itemCode: itemCode ?? null,
              reason: error.message ?? 'Unknown error',
            });
          }
        }).filter(Boolean);

        await Promise.all(updates);
        page += 1;
      }

      result.summary.duration = Date.now() - startTime;
      result.summary.totalProcessed =
        result.updatedProducts.length + result.notFoundProducts.length + result.failedProducts.length;
      result.summary.updatedCount = result.updatedProducts.length;
      result.summary.notFoundCount = result.notFoundProducts.length;
      result.summary.failedCount = result.failedProducts.length;

      console.log(`[SAP-SYNC] Synchronization completed (${refId}):`, result.summary);

      await CronReportQueueService.getInstance().publishSapCronReport({
        taskName: 'sap-daily-sync',
        refId: params.refId,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
        success: true,
        sapSyncResult: result,
      });
      // await SAPSyncCronTask.sendTelegramReport(params, startTime, Date.now(), result, null);

      syncSucceeded = true;
      return result;
    } catch (error) {
      result.summary.duration = Date.now() - startTime;
      console.error(`[SAP-SYNC] Synchronization failed (${refId}):`, error);

      await CronReportQueueService.getInstance().publishSapCronReport({
        taskName: 'sap-daily-sync',
        refId: params.refId,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: error?.message || error?.toString(),
        sapSyncResult: result,
      });

      // await SAPSyncCronTask.sendTelegramReport(params, startTime, Date.now(), result, error);

      throw error;
    } finally {
      // derive IDs from result — no separate accumulator array
      if (syncSucceeded && result.updatedProducts.length > 0) {
        const env = process.env.NODE_ENV;

        // all patterns handed off to one single SCAN pass
        const patterns = result.updatedProducts.flatMap(({ productId }) => [
          `${env}:product:basic:${productId?.toString()}:`,
          `${env}:product:detail:${productId?.toString()}:`,
        ]);

        await redisClient.deleteProductCachesByPatterns(patterns);
      }
    }
  }

  /**
   * Send Telegram report for cron task completion
   */
  private static async sendTelegramReport(
    params: BaseCaseParamsInterface<{}>,
    startTime: number,
    endTime: number,
    result: SAPSyncResult,
    error: any
  ): Promise<void> {
    try {
      const telegramSender = new TelegramBotMessageSender();

      await telegramSender.sendCronReport({
        taskName: 'sap-daily-sync',
        refId: params.refId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        success: !error,
        error: error?.message || error?.toString(),
        sapSyncResult: result
      });

      console.log(`[SAP-SYNC] Telegram report sent successfully (${params.refId})`);
    } catch (telegramError) {
      console.error(`[SAP-SYNC] Failed to send Telegram report (${params.refId}):`, telegramError);
      // Don't throw error to avoid breaking the main sync process
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  static async getSyncStats(): Promise<{
    totalProducts: number;
    productsWithItemCode: number;
    productsWithoutItemCode: number;
    lastSyncTime?: Date;
  }> {
    const totalProducts = await Repository.Products().countDocumentsByFilter({ status: { $ne: ProductStatusEnum.DELETED } });
    const productsWithItemCode = await Repository.Products().countDocumentsByFilter({
      status: { $ne: ProductStatusEnum.DELETED },
      itemCode: { $exists: true, $ne: null }
    });

    return {
      totalProducts,
      productsWithItemCode,
      productsWithoutItemCode: totalProducts - productsWithItemCode
    };
  }
}