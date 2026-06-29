import * as KoaRouter from '@koa/router';
import { BonussesControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const BonussesRouter = new KoaRouter().prefix('/bonusses');

BonussesRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BONUSSES_LIST, PERMISSIONS.BONUSSES_ALL), BonussesControllers.BonussesListController);
BonussesRouter.get('/detail/:bonussesId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BONUSSES_DETAIL, PERMISSIONS.BONUSSES_ALL), BonussesControllers.BonussesDetailController);
BonussesRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BONUSSES_CREATE, PERMISSIONS.BONUSSES_ALL), BonussesControllers.AddBonussesController);
BonussesRouter.put('/:bonussesId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BONUSSES_UPDATE, PERMISSIONS.BONUSSES_ALL), BonussesControllers.UpdateBonussesController);
BonussesRouter.delete('/:bonussesId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BONUSSES_DELETE, PERMISSIONS.BONUSSES_ALL), BonussesControllers.DeleteBonussesController);
