import * as KoaRouter from '@koa/router';
import { BarcodeControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';

export const BarcodeRouter = new KoaRouter().prefix('/barcode');

BarcodeRouter.post('/print-product-barcode', CheckClientSessionMiddleware(), BarcodeControllers.PrintBarcodeController);
