import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { IdParams } from '../../infrastructure';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/chats')
export default class DeleteChatController {
  @request('delete', '/{chatId}')
  @summary('Delete chat')
  @security([])
  @tags(['Chats'])
  @path({ chatId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.chatId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const beforeChat = await Repository.Chats().findOneRaw(new Types.ObjectId(params.id));
      if(!beforeChat) {
        throw new NotFoundError('Chat');
      }
      const deleted = await Repository.Chats().deleteById(new Types.ObjectId(params.id));
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Characteristic',
        resourceId: new Types.ObjectId(params.id),
        before: beforeChat
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Chats',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
