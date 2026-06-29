import * as KoaRouter from '@koa/router';
import { IndexControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';

export const DbIndexRouter = new KoaRouter().prefix('/indexes');

DbIndexRouter.post('/create', CheckClientSessionMiddleware(), IndexControllers.CreateIndexesController);