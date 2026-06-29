import { Context } from 'koa';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import {
    LifehackCommentsEntity,
    LifehackCommentTypeEnum,
    NotFoundError,
    Repository,
} from '@ubaytools/core';
import { AddLifehackCommentReplyParams } from '../../infrastructure';

@prefix('/lifehacks')
export default class AddLifehackCommentReplyController {
    @request('post', '/comment-reply/add')
    @summary('Add lifehack comment reply')
    @security([])
    @tags(['Lifehacks'])
    @body((AddLifehackCommentReplyParams as any).swaggerDocument)
    static async controller(context: Context): Promise<void> {
        let params: AddLifehackCommentReplyParams;

        try {
            params = await new AddLifehackCommentReplyParams(context.request.body).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const parentCommentId = new Types.ObjectId(params.comment);

            const foundParentComment = await Repository.LifehackComments().getById(parentCommentId);
            if (!foundParentComment) {
                throw new NotFoundError('Lifehack comment');
            }

            if (foundParentComment.getType() !== LifehackCommentTypeEnum.COMMENT) {
                throw new NotFoundError('Parent comment');
            }

            const reply = new LifehackCommentsEntity()
                .buildLifehack(foundParentComment.getLifehack() as Types.ObjectId)
                .buildAdmin(context.auth.admin.getId())
                .buildText(params.text)
                .buildType(LifehackCommentTypeEnum.REPLY)
                .buildParentComment(foundParentComment.getId())
                .buildReplyCount(0);

            const created = await Repository.LifehackComments().create(reply);

            await Repository.LifehackComments().incrementReplyCount(
                foundParentComment.getId() as Types.ObjectId,
            );

            const parent = await Repository.LifehackComments().getById(parentCommentId);

            parent.buildReplied(true);

            Repository.LifehackComments().update(parent);

            return context.send.data({ id: created.getId().toString() });
        } catch (error) {
            return context.send.error(error);
        }
    }
}