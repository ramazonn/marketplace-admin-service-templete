import * as KoaRouter from '@koa/router';
import { PromotionControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const PromotionRouter = new KoaRouter().prefix('/promotion');

PromotionRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOTION_LIST, PERMISSIONS.PROMOTION_ALL), PromotionControllers.PromotionListController); // group by type
PromotionRouter.post('/add-banner', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOTION_ADD_BANNER, PERMISSIONS.PROMOTION_ALL), PromotionControllers.AddBannerToPromotionController); // params{bannerImage, startDate, endDate, url, type} Type{FirstLineHero, SecondLineHere, MiddleLine, CategoryLine}
PromotionRouter.put('/reorder-banners', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOTION_REORDER_BANNERS, PERMISSIONS.PROMOTION_ALL), PromotionControllers.ReOrderBannerPromotionsController); // params{bannerImage, startDate, endDate, url, type} Type{FirstLineHero, SecondLineHere, MiddleLine, CategoryLine}
PromotionRouter.delete('/:promotionId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOTION_DELETE, PERMISSIONS.PROMOTION_ALL), PromotionControllers.DeletePromotionController); // seems like remove banner from promotion, but actually removed promotion
PromotionRouter.put('/:promotionId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PROMOTION_UPDATE, PERMISSIONS.PROMOTION_ALL), PromotionControllers.UpdatePromotionController);
