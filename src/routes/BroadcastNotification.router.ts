import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import { BroadcastNotificationControllers } from '../controllers';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const BroadcastNotificationRouter = new KoaRouter().prefix('/broadcast-notification');

BroadcastNotificationRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BROADCAST_NOTIFICATION_LIST, PERMISSIONS.BROADCAST_NOTIFICATION_ALL), BroadcastNotificationControllers.BroadcastNotificationListController);
BroadcastNotificationRouter.get('/detail/:broadcastNotificationId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BROADCAST_NOTIFICATION_DETAIL, PERMISSIONS.BROADCAST_NOTIFICATION_ALL), BroadcastNotificationControllers.BroadcastNotificationDetailController);
BroadcastNotificationRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BROADCAST_NOTIFICATION_CREATE, PERMISSIONS.BROADCAST_NOTIFICATION_ALL), BroadcastNotificationControllers.AddBroadcastNotificationController);
BroadcastNotificationRouter.put('/:broadcastNotificationId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BROADCAST_NOTIFICATION_UPDATE, PERMISSIONS.BROADCAST_NOTIFICATION_ALL), BroadcastNotificationControllers.UpdateBroadcastNotificationController);
BroadcastNotificationRouter.delete('/:broadcastNotificationId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.BROADCAST_NOTIFICATION_DELETE, PERMISSIONS.BROADCAST_NOTIFICATION_ALL), BroadcastNotificationControllers.DeleteBroadcastNotificationController);

