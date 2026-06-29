import * as KoaRouter from '@koa/router';
import { DeliveryRuleControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const DeliveryRulesRouter = new KoaRouter().prefix('/delivery-rules');

DeliveryRulesRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.DELIVERY_RULE_LIST, PERMISSIONS.DELIVERY_RULE_ALL), DeliveryRuleControllers.DeliveryRuleListController);
DeliveryRulesRouter.get('/detail/:deliveryRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.DELIVERY_RULE_DETAIL, PERMISSIONS.DELIVERY_RULE_ALL), DeliveryRuleControllers.DeliveryRuleDetailController);
DeliveryRulesRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.DELIVERY_RULE_CREATE, PERMISSIONS.DELIVERY_RULE_ALL), DeliveryRuleControllers.AddDeliveryRuleController);
DeliveryRulesRouter.put('/:deliveryRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.DELIVERY_RULE_UPDATE, PERMISSIONS.DELIVERY_RULE_ALL), DeliveryRuleControllers.UpdateDeliveryRuleController);
DeliveryRulesRouter.delete('/:deliveryRuleId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.DELIVERY_RULE_DELETE, PERMISSIONS.DELIVERY_RULE_ALL), DeliveryRuleControllers.DeleteDeliveryRuleController);
