import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import { RoleControllers } from '../controllers';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const RolesRouter = new KoaRouter().prefix('/roles');

RolesRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ROLE_LIST, PERMISSIONS.ROLE_ALL), RoleControllers.RolesListController);
RolesRouter.get('/detail/:roleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ROLE_DETAIL, PERMISSIONS.ROLE_ALL), RoleControllers.GetRoleDetailController);
RolesRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_ALL), RoleControllers.AddRoleController);
RolesRouter.put('/update/:roleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_ALL),  RoleControllers.UpdateRoleController);
RolesRouter.delete('/delete/:roleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ROLE_DELETE, PERMISSIONS.ROLE_ALL),  RoleControllers.DeleteRoleController);