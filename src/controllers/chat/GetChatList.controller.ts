import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { ChatsEntity, Repository, SenderTypeEnum, StoresEntity, UserEntity } from '@ubaytools/core';
import { ListParams } from '../../infrastructure';
import { DateFilterParams } from '../../infrastructure';
import { Types } from 'mongoose';

type UserDataType = { id: string; phoneNumber: string; firstName: string; lastName: string; avatar: string };
type StoreDataType = { id: string; name: string; avatar: string };

export class ChatResponse {
  id: string;
  title: string;
  store: StoreDataType;
  user: UserDataType;
  unreadMessages: number;

  constructor(chat: ChatsEntity, user: UserEntity, store: StoresEntity | null, unreadMessages: number) {
    this.id = chat.getId().toString();
    this.title = chat.getTitle();

    this.user = {
      id: user.getId().toString(),
      phoneNumber: user.getPhoneNumber(),
      firstName: user.getUserInfo()?.getFirstname() ?? null,
      lastName: user.getUserInfo()?.getLastname() ?? null,
      avatar: user.getUserInfo()?.getAvatar() ?? null,
    };

    this.store = store
      ? {
          id: store.getId().toString(),
          name: store.getName(),
          avatar: store.getAvatar(),
        }
      : null;

    this.unreadMessages = unreadMessages;
  }
}

@prefix('/chats')
export default class GetChatListController {
  @request('get', '/list')
  @summary('Get all chats for a user')
  @security([])
  @tags(['Chats'])
  @query({
    ...(ListParams as any).swaggerDocument,
    ...(DateFilterParams as any).swaggerDocument,
    store: {
      type: 'string',
      required: false,
      description: 'Store ID to filter chats',
    },
  })
  static async controller(context: Context): Promise<void> {
    let listParams: ListParams;
    let dateParams: DateFilterParams;
    try {
      listParams = await new ListParams(context.request.query).validate();
      dateParams = await new DateFilterParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const store = context.request.query.store as string | undefined;

      const filter: any = {};

      if (store) {
        filter.store = new Types.ObjectId(store);
      }

      if (dateParams.startDate || dateParams.endDate) {
        filter.lastMessageAt = {
          ...(dateParams.startDate ? { $gte: new Date(dateParams.startDate) } : {}),
          ...(dateParams.endDate ? { $lte: new Date(dateParams.endDate) } : {}),
        };
      }

      const totalCount = await Repository.Chats().countDocumentsByFilter(filter);

      const chats = await Repository.Chats().list(
        { page: listParams.page, size: listParams.size },
        filter,
        { lastMessageAt: -1 },
      );

      const items = await Promise.all(
        chats.map(async (chat) => {
          const user = await Repository.Users().getById(chat.getUser() as Types.ObjectId);

          const storeEntity = (chat.getStore() as any) ?? null;

          const unreadMessages = await Repository.ChatMessages().countDocumentsByFilter({
            chatId: chat.getId(),
            senderType: SenderTypeEnum.USER,
            isRead: false,
          });

          return new ChatResponse(chat, user, storeEntity, unreadMessages);
        }),
      );
      return context.send.data({
        count: totalCount,
        items,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
