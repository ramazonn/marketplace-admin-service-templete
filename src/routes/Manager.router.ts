import * as KoaRouter from '@koa/router';
import { ManagersControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const ManagerRouter = new KoaRouter().prefix('/manager');

ManagerRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_LIST, PERMISSIONS.MANAGER_ALL),  ManagersControllers.GetManagerListController);
ManagerRouter.get('/detail/:managerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_DETAIL, PERMISSIONS.MANAGER_ALL), ManagersControllers.GetManagerDetailController);
ManagerRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_CREATE, PERMISSIONS.MANAGER_ALL), ManagersControllers.AddManagerController);
ManagerRouter.put('/:managerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_UPDATE, PERMISSIONS.MANAGER_ALL), ManagersControllers.UpdateManagerController);
ManagerRouter.delete('/:managerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_DELETE, PERMISSIONS.MANAGER_ALL), ManagersControllers.DeleteManagerController);
ManagerRouter.post('/migrate-managers-stats', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MANAGER_MIGRATE_STATS, PERMISSIONS.MANAGER_ALL), ManagersControllers.MigrateManagersStatsController);
