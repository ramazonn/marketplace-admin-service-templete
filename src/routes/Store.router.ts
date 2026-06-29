import * as KoaRouter from '@koa/router';
import { StoreControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const StoresRouter = new KoaRouter().prefix('/store');

StoresRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_LIST, PERMISSIONS.STORE_ALL), StoreControllers.StoreListController);
StoresRouter.get('/detail/:storeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_DETAIL, PERMISSIONS.STORE_ALL), StoreControllers.GetStoreDetailController);
StoresRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CREATE, PERMISSIONS.STORE_ALL), StoreControllers.AddStoreController);
StoresRouter.put('/:storeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_UPDATE, PERMISSIONS.STORE_ALL), StoreControllers.UpdateStoreController);
StoresRouter.delete('/:storeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_DELETE, PERMISSIONS.STORE_ALL), StoreControllers.DeleteStoreController);
