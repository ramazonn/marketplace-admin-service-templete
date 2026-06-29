import * as KoaRouter from '@koa/router';
import { B2BLeadControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const B2BLeadRouter = new KoaRouter().prefix('/b2b-leads');

B2BLeadRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.B2B_LEAD_LIST, PERMISSIONS.B2B_LEAD_ALL), B2BLeadControllers.B2BLeadListController);
B2BLeadRouter.get('/detail/:b2bLeadId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.B2B_LEAD_DETAIL, PERMISSIONS.B2B_LEAD_ALL), B2BLeadControllers.B2BLeadDetailController);
B2BLeadRouter.put('/:b2bLeadId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.B2B_LEAD_UPDATE, PERMISSIONS.B2B_LEAD_ALL), B2BLeadControllers.UpdateB2BLeadController);
B2BLeadRouter.delete('/:b2bLeadId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.B2B_LEAD_DELETE, PERMISSIONS.B2B_LEAD_ALL), B2BLeadControllers.DeleteB2BLeadController);
