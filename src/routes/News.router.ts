import * as KoaRouter from '@koa/router';
import { NewsControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const NewsRouter = new KoaRouter().prefix('/news');

NewsRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_LIST, PERMISSIONS.NEWS_ALL), NewsControllers.NewsListController);
NewsRouter.get('/detail/:newsId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_DETAIL, PERMISSIONS.NEWS_ALL), NewsControllers.GetNewsByIdController);
NewsRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_CREATE, PERMISSIONS.NEWS_ALL), NewsControllers.AddNewsController);
NewsRouter.put('/:newsId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_UPDATE, PERMISSIONS.NEWS_ALL), NewsControllers.UpdateNewsController);
NewsRouter.post('/cancel/:newsId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_CANCEL, PERMISSIONS.NEWS_ALL), NewsControllers.CancelNewsController);
NewsRouter.delete('/:newsId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_DELETE, PERMISSIONS.NEWS_ALL), NewsControllers.DeleteNewsController);
NewsRouter.post('/migrate-attachments', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.NEWS_MIGRATE_ATTACHMENTS, PERMISSIONS.NEWS_ALL), NewsControllers.MigrateNewsAttachmentsController)