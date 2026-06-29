import * as KoaRouter from '@koa/router';
import { VideContentControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const VideoContentRouter = new KoaRouter().prefix('/video-contents');

VideoContentRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.VIDEO_CONTENT_LIST, PERMISSIONS.VIDEO_CONTENT_ALL), VideContentControllers.VideContentListController);
VideoContentRouter.get('/detail/:videoContentId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.VIDEO_CONTENT_DETAIL, PERMISSIONS.VIDEO_CONTENT_ALL), VideContentControllers.VideContentDetailController);
VideoContentRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.VIDEO_CONTENT_CREATE, PERMISSIONS.VIDEO_CONTENT_ALL), VideContentControllers.AddVideContentController);
VideoContentRouter.put('/:videoContentId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.VIDEO_CONTENT_UPDATE, PERMISSIONS.VIDEO_CONTENT_ALL), VideContentControllers.UpdateVideContentController);
VideoContentRouter.delete('/:videoContentId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.VIDEO_CONTENT_DELETE, PERMISSIONS.VIDEO_CONTENT_ALL), VideContentControllers.DeleteVideContentController);
