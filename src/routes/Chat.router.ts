import * as KoaRouter from '@koa/router';
import { ChatControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';
import { PERMISSIONS } from '@ubaytools/core';
import { PermissionGuard } from '../middlewares/PermissionGuard.middleware';

export const ChatRouter = new KoaRouter().prefix('/chats');

ChatRouter.delete('/:chatId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_DELETE, PERMISSIONS.CHAT_ALL), ChatControllers.DeleteChatController);
ChatRouter.get('/list', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_LIST, PERMISSIONS.CHAT_ALL), ChatControllers.GetChatListController);
ChatRouter.get('/detail/:chatId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_DETAIL, PERMISSIONS.CHAT_ALL), ChatControllers.GetChatDetailController);
ChatRouter.get('/messages/:chatId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_MESSAGES, PERMISSIONS.CHAT_ALL), ChatControllers.GetChatMessagesController);
ChatRouter.post('/message/write', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_WRITE_MESSAGE, PERMISSIONS.CHAT_ALL), ChatControllers.WriteMessageController);
ChatRouter.post('/create', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_CREATE, PERMISSIONS.CHAT_ALL), ChatControllers.CreateChatController);
ChatRouter.put('/message-to-read/:messageId', CheckClientSessionMiddleware(), PermissionGuard(PERMISSIONS.CHAT_SET_MESSAGE_TO_READ, PERMISSIONS.CHAT_ALL), ChatControllers.SetMessageToReadController);
