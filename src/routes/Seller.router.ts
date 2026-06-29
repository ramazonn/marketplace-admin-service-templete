import * as KoaRouter from '@koa/router';
import { SellerControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const SellerRouter = new KoaRouter().prefix('/seller');

SellerRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_LIST, PERMISSIONS.SELLER_ALL), SellerControllers.SellerListController);
SellerRouter.get('/detail/:sellerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_DETAIL, PERMISSIONS.SELLER_ALL), SellerControllers.GetSellerDetailController);
SellerRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_CREATE, PERMISSIONS.SELLER_ALL), SellerControllers.AddSellerController);
SellerRouter.put('/:sellerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_UPDATE, PERMISSIONS.SELLER_ALL), SellerControllers.UpdateSellerController);
SellerRouter.delete('/:sellerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SELLER_DELETE, PERMISSIONS.SELLER_ALL), SellerControllers.DeleteSellerController);
