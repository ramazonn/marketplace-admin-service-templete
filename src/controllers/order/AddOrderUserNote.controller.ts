import { NotFoundError, Repository, UserNoteEntity } from "@ubaytools/core";
import { body, prefix, request, security, summary, tags } from "koa-swagger-decorator";
import { Types } from "mongoose";
import { Context } from "koa";
import { AddUserNoteParams } from "../../infrastructure";

@prefix('/orders')
export default class AddUserNoteController {
  @request('post', '/user-note/add')
  @summary('Add user note')
  @security([])
  @tags(['Orders'])
  @body((AddUserNoteParams as any).swaggerDocument)
  static async controller(ctx: Context): Promise<void> {
    let params: AddUserNoteParams;

    try {
      params = await new AddUserNoteParams(ctx.request.body).validate();
    } catch (error) {
      const joiError = await ctx.joi.handle(error);
      return ctx.send.error(joiError);
    }

    try {
      const user = await Repository.Users().getById(
        new Types.ObjectId(params.user)
      );

      if (!user) {
        throw new NotFoundError('user')
      }

      const prevNotes = user.getUserNotes();

      console.log(ctx.auth)
      const newNote = new UserNoteEntity()
        .buildText(params.text)
        .buildAdminId(ctx.auth.admin.getId().toString())
        .buildAdminName(ctx.auth.adminName)
        .buildCreatedAt(new Date());

      prevNotes.push(newNote);

      user.buildUserNotes(prevNotes.map(n => n.convertToSchema()));

      const created = await Repository.Users().update(user);

      return ctx.send.data({ created: true, id: created.getId().toString() });
    } catch (error) {
      return ctx.send.error(error);
    }
  }
}