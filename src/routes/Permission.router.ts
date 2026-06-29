import * as KoaRouter from '@koa/router';
import { PermissionControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const PermissionRouter = new KoaRouter().prefix('/permissions');

PermissionRouter.get('/catalog',  CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PERMISSION_CATALOG_READ, PERMISSIONS.PERMISSION_CATALOG_ALL),
  PermissionControllers.GetPermissionCatalogController
);