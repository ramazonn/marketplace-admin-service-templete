import * as KoaRouter from '@koa/router';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PaymentControllers } from '../controllers/payment';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const PaymentRouter = new KoaRouter().prefix('/payment');

PaymentRouter.get('/log/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PAYMENT_LOG_LIST, PERMISSIONS.PAYMENT_ALL), PaymentControllers.PaymentLogController);
