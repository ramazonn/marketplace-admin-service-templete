import * as KoaRouter from '@koa/router';
import { LifehackControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const LifehackRouter = new KoaRouter().prefix('/lifehacks');

LifehackRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_LIST), LifehackControllers.LifehackListController);
LifehackRouter.get('/detail/:lifehackId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_DETAIL),  LifehackControllers.LifehackDetailController);
LifehackRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_CREATE),  LifehackControllers.AddLifehackController);
LifehackRouter.put('/:lifehackId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_UPDATE),  LifehackControllers.UpdateLifehackController);
LifehackRouter.delete('/:lifehackId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_DELETE),  LifehackControllers.DeleteLifehackController);
LifehackRouter.get('/detail/:lifehackId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.LIFEHACK_DETAIL), LifehackControllers.LifehackDetailController);


LifehackRouter.get('/comments-list/:lifehackId', CheckClientSessionMiddleware(), LifehackControllers.GetLifehackCommentsListController);
LifehackRouter.get('/comment-replies-list/:commentId', CheckClientSessionMiddleware(), LifehackControllers.GetLifehackCommentRepliesController);
LifehackRouter.get('/likes-list/:lifehackId', CheckClientSessionMiddleware(), LifehackControllers.GetLifehackLikesListController);
LifehackRouter.post('/comment-reply/add', CheckClientSessionMiddleware(), LifehackControllers.AddLifehackCommentReplyController);
LifehackRouter.delete('/comment-reply-delete/:replyId', CheckClientSessionMiddleware(), LifehackControllers.DeleteLifehackCommentReplyController);
LifehackRouter.delete('/comment-delete/:commentId', CheckClientSessionMiddleware(), LifehackControllers.DeleteLifehackCommentController);
