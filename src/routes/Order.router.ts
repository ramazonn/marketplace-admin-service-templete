import * as KoaRouter from '@koa/router';
import { OrderControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const OrderRouter = new KoaRouter().prefix('/orders');

OrderRouter.post('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_LIST, PERMISSIONS.ORDER_ALL), OrderControllers.OrderListController);
OrderRouter.post('/:orderId/excel/download', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_DOWNLOAD_EXCEL, PERMISSIONS.ORDER_ALL), OrderControllers.DownloadInExcelController);
OrderRouter.post('/items-excel-download', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_ITEMS_EXCEL_DOWNLOAD, PERMISSIONS.ORDER_ALL), OrderControllers.DownloadOrderItemsInExcelIncludingSapPriceController);
OrderRouter.get('/detail/:orderId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_DETAIL, PERMISSIONS.ORDER_ALL), OrderControllers.OrderDetailController);
// OrderRouter.get('/by-client/:clientId', CheckClientSessionMiddleware(), OrderControllers.OrdersByClientController);
OrderRouter.put('/cancel', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_CANCEL, PERMISSIONS.ORDER_ALL), OrderControllers.CancelOrderController);
OrderRouter.put('/:orderId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_UPDATE, PERMISSIONS.ORDER_ALL), OrderControllers.UpdateOrderController);
OrderRouter.post('/retry-failed-job/:orderId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_RETRY_FAILED_JOB, PERMISSIONS.ORDER_ALL), OrderControllers.RetryFailedJobController);
OrderRouter.post('/:orderId/send-ready-pickup-push', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.ORDER_SEND_READY_PICKUP_PUSH, PERMISSIONS.ORDER_ALL), OrderControllers.SendReadyPickupPushController); 
OrderRouter.post('/user-note/add', CheckClientSessionMiddleware(), OrderControllers.AddUserNoteController)
OrderRouter.get('/users/notes/:userId', CheckClientSessionMiddleware(), OrderControllers.UserNotesListController)