import * as KoaRouter from '@koa/router';
import { PartnerBrandsControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const PartnerBrandsRouter = new KoaRouter().prefix('/partner-brands');

PartnerBrandsRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PARTNER_BRAND_LIST, PERMISSIONS.PARTNER_BRAND_ALL), PartnerBrandsControllers.PartnerBrandsListController);
PartnerBrandsRouter.get('/detail/:partnerBrandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PARTNER_BRAND_DETAIL, PERMISSIONS.PARTNER_BRAND_ALL), PartnerBrandsControllers.PartnerBrandsDetailController);
PartnerBrandsRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PARTNER_BRAND_CREATE, PERMISSIONS.PARTNER_BRAND_ALL), PartnerBrandsControllers.AddPartnerBrandsController);
PartnerBrandsRouter.put('/:partnerBrandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PARTNER_BRAND_UPDATE, PERMISSIONS.PARTNER_BRAND_ALL), PartnerBrandsControllers.UpdatePartnerBrandsController);
PartnerBrandsRouter.delete('/:partnerBrandId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.PARTNER_BRAND_DELETE, PERMISSIONS.PARTNER_BRAND_ALL), PartnerBrandsControllers.DeletePartnerBrandsController);

