import * as KoaRouter from '@koa/router';
import { ProductControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const ProductRouter = new KoaRouter().prefix('/product');

ProductRouter.post('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_LIST, PERMISSIONS.PRODUCT_ALL), ProductControllers.ProductListController);
ProductRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_ALL), ProductControllers.AddProductController);
ProductRouter.post('/check-sku', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_CHECK_SKU, PERMISSIONS.PRODUCT_ALL), ProductControllers.CheckProductSku);
ProductRouter.put('/:productId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_ALL), ProductControllers.UpdateProductController);
ProductRouter.delete('/:productId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_DELETE, PERMISSIONS.PRODUCT_ALL), ProductControllers.DeleteProductController);
ProductRouter.get('/detail/:productId', CheckClientSessionMiddleware(),PermissionGuard(PERMISSIONS.PRODUCT_DETAIL, PERMISSIONS.PRODUCT_ALL), ProductControllers.GetProductDetailController);
ProductRouter.get('/selling-detail/:productId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_SELLING_DETAIL, PERMISSIONS.PRODUCT_ALL), ProductControllers.GetProductSellingDetailController);
ProductRouter.post('/sync-count', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_SYNC_COUNT, PERMISSIONS.PRODUCT_ALL), ProductControllers.SyncProductsCountController);
ProductRouter.post('/sync-price', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_SYNC_PRICE, PERMISSIONS.PRODUCT_ALL), ProductControllers.SyncProductsPriceController);
ProductRouter.post('/set-minimum-count', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_SET_MINIMUM_COUNT, PERMISSIONS.PRODUCT_ALL), ProductControllers.SetMinimumCountController);
ProductRouter.post('/set-get-count-from-eshop', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_SET_GET_COUNT_FROM_ESHOP, PERMISSIONS.PRODUCT_ALL), ProductControllers.SetGetCountFromEshopController);
ProductRouter.post('/list/download-excel', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_DOWNLOAD_EXCEL, PERMISSIONS.PRODUCT_ALL), ProductControllers.DownloadProductsInExcel);
ProductRouter.post('/status/bulk', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PRODUCT_STATUS_BULK_UPDATE, PERMISSIONS.PRODUCT_ALL), ProductControllers.UpdateMultipleProductStatusController);
ProductRouter.get('/migration/store-products-count', CheckClientSessionMiddleware(), ProductControllers.StoreProductsCountMigrationController)
ProductRouter.get('/migration/store-orders-count', CheckClientSessionMiddleware(), ProductControllers.StoreOrdersCountMigrationController)
ProductRouter.get('/migration/store-reviews-stats', CheckClientSessionMiddleware(), ProductControllers.StoreReviewsStatsMigrationController)
