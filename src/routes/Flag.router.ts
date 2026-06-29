import * as KoaRouter from '@koa/router';
import { FlagControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const FlagRouter = new KoaRouter().prefix('/flag');

FlagRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FLAG_LIST, PERMISSIONS.FLAG_ALL), FlagControllers.GetFlagListController);
FlagRouter.get('/detail/:flagId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FLAG_DETAIL, PERMISSIONS.FLAG_ALL), FlagControllers.GetFlagDetailController);
FlagRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FLAG_CREATE, PERMISSIONS.FLAG_ALL), FlagControllers.AddFlagController);
FlagRouter.put('/:flagId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FLAG_UPDATE, PERMISSIONS.FLAG_ALL), FlagControllers.UpdateFlagController);
FlagRouter.delete('/:flagId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FLAG_DELETE, PERMISSIONS.FLAG_ALL), FlagControllers.DeleteFlagController);
