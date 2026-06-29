import * as KoaRouter from '@koa/router';
import { AdminControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const AdminRouter = new KoaRouter().prefix('/admins');

AdminRouter.post('/add', AdminControllers.AddAdminController);
AdminRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ADMIN_LIST, PERMISSIONS.ADMIN_ALL), AdminControllers.AdminListController);
AdminRouter.get('/detail/:adminId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ADMIN_DETAIL, PERMISSIONS.ADMIN_ALL), AdminControllers.AdminDetailController);
AdminRouter.put('/:adminId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ADMIN_UPDATE, PERMISSIONS.ADMIN_ALL), AdminControllers.UpdateAdminController);
AdminRouter.delete('/:adminId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ADMIN_DELETE, PERMISSIONS.ADMIN_ALL), AdminControllers.DeleteAdminController);
