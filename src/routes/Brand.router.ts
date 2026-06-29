import * as KoaRouter from '@koa/router';
import { BrandControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const BrandRouter = new KoaRouter().prefix('/brand');

BrandRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BRAND_LIST, PERMISSIONS.BRAND_ALL), BrandControllers.BrandListController);
BrandRouter.get('/detail/:brandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BRAND_DETAIL, PERMISSIONS.BRAND_ALL), BrandControllers.BrandDetailController);
BrandRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BRAND_CREATE, PERMISSIONS.BRAND_ALL), BrandControllers.AddBrandController);
BrandRouter.put('/:brandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BRAND_UPDATE, PERMISSIONS.BRAND_ALL), BrandControllers.UpdateBrandController);
BrandRouter.delete('/:brandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BRAND_DELETE, PERMISSIONS.BRAND_ALL), BrandControllers.DeleteBrandController);
