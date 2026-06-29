import * as KoaRouter from '@koa/router';
import { AuthControllers, CharacteristicControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const CharacteristicRouter = new KoaRouter().prefix('/characteristic');

CharacteristicRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_LIST, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.CharacteristicListController);
CharacteristicRouter.post('/product-characteristics', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_PRODUCT_CHARACTERISTICS, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.ProductCharacteristicsController);
CharacteristicRouter.get('/detail/:characteristicId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_DETAIL, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.GetCharacteristicDetailController);
CharacteristicRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_CREATE, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.AddCharacteristicController);
CharacteristicRouter.put('/set-to-category/:characteristicId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_SET_TO_CATEGORY, PERMISSIONS.CHARACTERISTIC_ALL),
  CharacteristicControllers.SetCharacteristicToCategoriesController,
); // param{categoriesIds}
CharacteristicRouter.put('/:characteristicId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_UPDATE, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.UpdateCharacteristicController);
CharacteristicRouter.delete('/:characteristicId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHARACTERISTIC_DELETE, PERMISSIONS.CHARACTERISTIC_ALL), CharacteristicControllers.DeleteCharacteristicController);
