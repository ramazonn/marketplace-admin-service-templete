import * as KoaRouter from '@koa/router';
import { AuthControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';

export const AuthRouter = new KoaRouter().prefix('/auth');

AuthRouter.post('/login', AuthControllers.LoginController);
AuthRouter.post('/lang', CheckClientSessionMiddleware(), AuthControllers.ChangeLanguageController);
