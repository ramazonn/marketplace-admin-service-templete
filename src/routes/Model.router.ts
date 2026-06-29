import * as KoaRouter from '@koa/router';
import { ModelControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const ModelRouter = new KoaRouter().prefix('/model');

ModelRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MODEL_LIST, PERMISSIONS.MODEL_ALL), ModelControllers.ModelListController);
ModelRouter.get('/detail/:modelId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MODEL_DETAIL, PERMISSIONS.MODEL_ALL), ModelControllers.GetModelDetailController);
ModelRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MODEL_CREATE, PERMISSIONS.MODEL_ALL), ModelControllers.AddModelController);
ModelRouter.put('/:modelId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MODEL_UPDATE, PERMISSIONS.MODEL_ALL), ModelControllers.UpdateModelController);
ModelRouter.delete('/:modelId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.MODEL_DELETE, PERMISSIONS.MODEL_ALL), ModelControllers.DeleteModelController);
