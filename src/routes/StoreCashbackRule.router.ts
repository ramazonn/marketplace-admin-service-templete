import * as KoaRouter from '@koa/router';
import { StoreCashbackRuleControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const StoreCashbackRuleRouter = new KoaRouter().prefix('/store-cashback-rule');

StoreCashbackRuleRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CASHBACK_RULE_LIST, PERMISSIONS.STORE_CASHBACK_RULE_ALL), StoreCashbackRuleControllers.StoreCashbackRuleListController);
StoreCashbackRuleRouter.get('/detail/:storeCashbackRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CASHBACK_RULE_DETAIL, PERMISSIONS.STORE_CASHBACK_RULE_ALL), StoreCashbackRuleControllers.StoreCashbackRuleDetailController);
StoreCashbackRuleRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CASHBACK_RULE_CREATE, PERMISSIONS.STORE_CASHBACK_RULE_ALL), StoreCashbackRuleControllers.AddStoreCashbackRuleController);
StoreCashbackRuleRouter.put('/:storeCashbackRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CASHBACK_RULE_UPDATE, PERMISSIONS.STORE_CASHBACK_RULE_ALL), StoreCashbackRuleControllers.UpdateStoreCashbackRuleController);
StoreCashbackRuleRouter.delete('/:storeCashbackRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.STORE_CASHBACK_RULE_DELETE, PERMISSIONS.STORE_CASHBACK_RULE_ALL), StoreCashbackRuleControllers.DeleteStoreCashbackRuleController);

