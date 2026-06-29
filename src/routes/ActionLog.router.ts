import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import ActionLogListController from '../controllers/actionLog/ActionLogList.controller';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const ActionLogRouter = new KoaRouter().prefix('/action-log');

ActionLogRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ACTION_LOG_LIST, PERMISSIONS.ALL),  ActionLogListController.controller);