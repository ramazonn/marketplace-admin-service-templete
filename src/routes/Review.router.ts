import * as KoaRouter from '@koa/router';
import { ReviewControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const ReviewRouter = new KoaRouter().prefix('/review');

ReviewRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.REVIEW_LIST, PERMISSIONS.REVIEW_ALL), ReviewControllers.ReviewListController);
ReviewRouter.post('/answer/:reviewId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.REVIEW_ANSWER, PERMISSIONS.REVIEW_ALL), ReviewControllers.AnswerToReviewController);
ReviewRouter.delete('/:reviewId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.REVIEW_DELETE, PERMISSIONS.REVIEW_ALL), ReviewControllers.DeleteReviewController);
