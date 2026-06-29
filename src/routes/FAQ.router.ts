import * as KoaRouter from '@koa/router';
import { FAQControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';
import { PERMISSIONS } from '@ubaytools/core';

export const FAQRouter = new KoaRouter().prefix('/faq');

FAQRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FAQ_LIST, PERMISSIONS.FAQ_ALL), FAQControllers.FAQListController);
FAQRouter.get('/detail/:faqId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FAQ_DETAIL, PERMISSIONS.FAQ_ALL), FAQControllers.GetFAQByIdController);
FAQRouter.post('/add', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FAQ_CREATE, PERMISSIONS.FAQ_ALL), FAQControllers.AddFAQController);
FAQRouter.put('/:faqId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FAQ_UPDATE, PERMISSIONS.FAQ_ALL), FAQControllers.UpdateFAQController);
FAQRouter.delete('/:faqId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.FAQ_DELETE, PERMISSIONS.FAQ_ALL), FAQControllers.DeleteFAQController);
