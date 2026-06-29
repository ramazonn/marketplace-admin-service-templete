import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import { SellerLeedControllers } from '../controllers/sellerLeeds';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const SellerLeedRouter = new KoaRouter().prefix('/seller-leeds');

SellerLeedRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_LEED_LIST, PERMISSIONS.SELLER_LEED_ALL), SellerLeedControllers.SellerLeedListController);
SellerLeedRouter.get('/detail/:sellerLeedId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_LEED_DETAIL, PERMISSIONS.SELLER_LEED_ALL), SellerLeedControllers.SellerLeedDetailController);
SellerLeedRouter.put('/:sellerLeedId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_LEED_UPDATE, PERMISSIONS.SELLER_LEED_ALL), SellerLeedControllers.UpdateSellerLeedController);
SellerLeedRouter.delete('/:sellerLeedId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_LEED_DELETE, PERMISSIONS.SELLER_LEED_ALL), SellerLeedControllers.DeleteSellerLeedController);
