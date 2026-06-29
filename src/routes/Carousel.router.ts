import * as KoaRouter from '@koa/router';
import { CarouselControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const CarouselRouter = new KoaRouter().prefix('/carousel');

CarouselRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_LIST, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.CarouselListController);
CarouselRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_CREATE, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.AddCarouselController);
CarouselRouter.post('/insert-product/:carouselId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_INSERT_PRODUCT, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.InsertProductToCarouselController);
CarouselRouter.post('/re-order-products/:carouselId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_REORDER_PRODUCTS, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.ReOrderProductsInCarousel);
CarouselRouter.post('/remove-product/:carouselId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_REMOVE_PRODUCT, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.RemoveProductFromCarouselController);
CarouselRouter.put('/:carouselId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_UPDATE, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.UpdateCarouselController);
CarouselRouter.delete('/:carouselId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CAROUSEL_DELETE, PERMISSIONS.CAROUSEL_ALL), CarouselControllers.DeleteCarouselController);
