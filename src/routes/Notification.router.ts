import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import { NotificationControllers } from '../controllers';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const NotificationRouter = new KoaRouter().prefix('/notification');

NotificationRouter.post('/send', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NOTIFICATION_SEND, PERMISSIONS.NOTIFICATION_ALL), NotificationControllers.SendNotificationController);
