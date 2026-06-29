import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { ChatsEntity, Repository, StoresEntity, UserEntity, NotFoundError } from '@ubaytools/core';
import { Types } from 'mongoose';
import { CreateChatParams } from '../../infrastructure';

type UserDataType = {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
};

type StoreDataType = {
  id: string;
  name: string;
  avatar: string | null;
};

export class ChatResponse {
  id: string;
  title: string;
  user: UserDataType;
  store: StoreDataType | null;

  constructor(chat: ChatsEntity, user: UserEntity, store: StoresEntity | null) {
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
        avatar: store.getAvatar() ?? null,
      }
      : null;
  }
}

@prefix('/chats')
export default class CreateChatController {
  @request('post', '/create')
  @summary('Create new chat for admin')
  @security([])
  @tags(['Chats'])
  @body((CreateChatParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: CreateChatParams;

    try {
      params = await new CreateChatParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const userId = new Types.ObjectId(params.user);
      const storeId = new Types.ObjectId(params.store);

      const user = await Repository.Users().getById(userId);
      if (!user) {
        throw new NotFoundError('User');
      }

      const store = await Repository.Stores().getById(storeId);
      if (!store) {
        throw new NotFoundError('Store');
      }

      let chats = await Repository.Chats().list(
        {},
        {
          user: userId,
          store: storeId,
        },
        { createdAt: -1 },
      );

      let chat = chats[0];

      if (!chat) {
        const chatToCreate = new ChatsEntity()
          .buildTitle('Support')
          .buildUser(userId)
          .buildStore(storeId)
          .buildLastMessageAt(new Date());

        chat = await Repository.Chats().create(chatToCreate);
      }

      const result = new ChatResponse(chat, user, store);

      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}