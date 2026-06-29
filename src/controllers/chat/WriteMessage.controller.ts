import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { ActionLogFailureReasonEnum, ActionTypeEnum, ChatMessagesEntity, MessageTypeEnum, Repository, SenderTypeEnum, StoresEntity } from '@ubaytools/core';
import { WriteChatMessageParams } from '../../infrastructure';
import { Types } from 'mongoose';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { ActionLogService } from '../../services';

@prefix('/chats')
export default class WriteMessageController {
  @request('post', '/message/write')
  @summary('Write chat message')
  @security([])
  @tags(['Chats'])
  @body((WriteChatMessageParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: WriteChatMessageParams;
    try {
      params = await new WriteChatMessageParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const messageToCreate = new ChatMessagesEntity()
        .buildMessage(params.message)
        .buildMessageType(params.messageType as MessageTypeEnum)
        .buildSenderType(SenderTypeEnum.MANAGER)
        .buildChatId(new Types.ObjectId(params.chatId))
        .buildIsRead(false);

      const created = await Repository.ChatMessages().create(messageToCreate);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Write chat',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      await WriteMessageController._chatLastMessageAt(params.chatId);

      try {
        const chat = await Repository.Chats().getById(new Types.ObjectId(params.chatId));
        
        if (chat && chat.getUser()) {
          const notificationService = new NotificationTemplateService();
          await notificationService.sendChatMessageNotification(
            chat.getUser().toString(),
            params.message,
            chat.getId().toString()
          );
        }
      } catch (notificationError) {
        console.error('Failed to send chat message notification:', notificationError);
      }

      return context.send.data({ messageId: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
              context,
              action: ActionTypeEnum.CREATE,
              resource: 'Write chat message',
              failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
      return context.send.error(error);
    }
  }

  static async _chatLastMessageAt(chatId: string) {
    try {
      const chat = await Repository.Chats().getById(new Types.ObjectId(chatId));
      chat.buildLastMessageAt(new Date());
      await Repository.Chats().update(chat);
    } catch (error) {
      console.error('Error updating chat last message at:', error);
    }
  }
}
