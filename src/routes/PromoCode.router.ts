import * as KoaRouter from '@koa/router';
import { PromoCodeControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const PromoCodeRouter = new KoaRouter().prefix('/promocode');

PromoCodeRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_LIST, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.PromoCodeListController);
PromoCodeRouter.get('/detail/:promoCodeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_DETAIL, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.GetPromoCodeByIdController);
PromoCodeRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_CREATE, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.AddPromoCodeController);
PromoCodeRouter.put('/:promoCodeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_UPDATE, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.UpdatePromoCodeController);
PromoCodeRouter.put('/:promoCodeId/status', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_TOGGLE_STATUS, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.TogglePromoCodeStatusController);
PromoCodeRouter.delete('/:promoCodeId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_DELETE, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.DeletePromoCodeController);
PromoCodeRouter.get('/:promoCodeId/stats', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOCODE_STATS, PERMISSIONS.PROMOCODE_ALL), PromoCodeControllers.PromoCodeStatsController);


