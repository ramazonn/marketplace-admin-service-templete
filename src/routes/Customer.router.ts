import * as KoaRouter from '@koa/router';
import { CustomerControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const CustomerRouter = new KoaRouter().prefix('/customer');

CustomerRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CUSTOMER_LIST, PERMISSIONS.CUSTOMER_ALL), CustomerControllers.CustomerListController);
CustomerRouter.get('/detail/:customerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CUSTOMER_DETAIL, PERMISSIONS.CUSTOMER_ALL), CustomerControllers.GetCustomerProfileController);
CustomerRouter.put('/:customerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CUSTOMER_UPDATE, PERMISSIONS.CUSTOMER_ALL), CustomerControllers.UpdateCustomerProfileController);
CustomerRouter.delete('/:customerId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CUSTOMER_DELETE, PERMISSIONS.CUSTOMER_ALL), CustomerControllers.DeleteCustomerProfileController);
