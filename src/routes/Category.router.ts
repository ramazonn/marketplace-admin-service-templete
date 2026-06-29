import * as KoaRouter from '@koa/router';
import { CategoryControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const CategoryRouter = new KoaRouter().prefix('/category');

CategoryRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_LIST, PERMISSIONS.CATEGORY_ALL), CategoryControllers.CategoryListController);
CategoryRouter.get('/recursive-list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_RECURSIVE_LIST, PERMISSIONS.CATEGORY_ALL), CategoryControllers.GetAllCategoryRecursiveController);
CategoryRouter.get('/detail/:categoryId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_DETAIL, PERMISSIONS.CATEGORY_ALL), CategoryControllers.GetCategoryByIdController);
CategoryRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_ALL), CategoryControllers.AddCategoryController); // Params {..., parent}
CategoryRouter.put('/:categoryId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_UPDATE, PERMISSIONS.CATEGORY_ALL), CategoryControllers.UpdateCategoryController);
CategoryRouter.delete('/:categoryId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CATEGORY_DELETE, PERMISSIONS.CATEGORY_ALL), CategoryControllers.DeleteCategoryController); // TODO think about subCategory and products
