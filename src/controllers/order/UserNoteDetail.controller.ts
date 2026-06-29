import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { NotFoundError, Repository, UserEntity } from '@ubaytools/core';
import { IdParams, ListParams } from '../../infrastructure';
import { Types } from 'mongoose';

export class UserNotesListItemResponse {
  user: string;
  firstname: string;
  lastname: string;
  avatar: string;
  notes: {
    text: string;
    adminId: string;
    adminName: string;
    createdAt: Date;
  }[];

  constructor(user: UserEntity) {
    const userInfo = user.getUserInfo();
    this.user = user.getId().toString();
    this.firstname = userInfo?.getFirstname?.() ?? null;
    this.lastname = userInfo?.getLastname?.() ?? null;
    this.avatar = userInfo?.getAvatar?.() ?? null;

    this.notes = user.getUserNotes().map((note) => ({
      text: note.getText(),
      adminId: note.getAdminId?.() ?? null,
      adminName: note.getAdminName?.() ?? null,
      createdAt: note.getCreatedAt(),
    }));
  }
}

@prefix('/orders')
export default class UserNotesListController {
  @request('get', '/users/notes/{userId}')
  @summary('User notes list')
  @security([])
  @tags(['Orders'])
  @path({
    userId: { type: 'string', required: true },
  })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;

    try {
      params = await new IdParams({ id: context.params.userId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const user = await Repository.Users().getById(new Types.ObjectId(params.id));

      if(!user) {
        throw new NotFoundError('User')
      }

      const response = new UserNotesListItemResponse(user);

      return context.send.data({
        items: response,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
