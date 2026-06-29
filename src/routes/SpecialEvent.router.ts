import * as KoaRouter from '@koa/router';
import { SpecialEventControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const SpecialEventRouter = new KoaRouter().prefix('/special-event');

SpecialEventRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_LIST, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.SpecialEventListController);
SpecialEventRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_CREATE, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.AddSpecialEventController);
SpecialEventRouter.post('/insert-product/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_INSERT_PRODUCT, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.InsertProductToSpecialEventController);
SpecialEventRouter.post('/remove-product/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_REMOVE_PRODUCT, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.RemoveProductFromSpecialEventController);
SpecialEventRouter.get('/detail/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_DETAIL, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.GetSpecialEventDetailController);
SpecialEventRouter.put('/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_UPDATE, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.UpdateSpecialEventController);
SpecialEventRouter.delete('/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_DELETE, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.DeleteSpecialEventController);
SpecialEventRouter.post('/re-order-products/:specialEventId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.SPECIAL_EVENT_REORDER_PRODUCTS, PERMISSIONS.SPECIAL_EVENT_ALL), SpecialEventControllers.ReOrderSpecialEventProductsController); 