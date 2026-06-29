import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import {
    LifehackCommentTypeEnum,
    NotFoundError,
    Repository,
} from '@ubaytools/core';
import { IdParams } from '../../infrastructure';

@prefix('/lifehacks')
export default class DeleteLifehackCommentReplyController {
    @request('delete', '/comment-reply-delete/{replyId}')
    @summary('Delete lifehack comment reply')
    @security([])
    @tags(['Lifehacks'])
    @path({ replyId: { type: 'string', required: true } })
    static async controller(context: Context): Promise<void> {
        let idParams: IdParams;

        try {
            idParams = await new IdParams({
                id: context.params.replyId,
            }).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const replyId = new Types.ObjectId(idParams.id);

            const foundReply = await Repository.LifehackComments().getById(replyId);
            if (!foundReply) {
                throw new NotFoundError('Lifehack comment reply');
            }

            if (foundReply.getType() !== LifehackCommentTypeEnum.REPLY) {
                throw new NotFoundError('Lifehack comment reply');
            }

            const admin = foundReply.getAdmin();
            const currentAdminId = context.auth.admin.getId().toString();

            let replyAdminId = '';

            if (admin instanceof Types.ObjectId) {
                replyAdminId = admin.toString();
            } else if (admin && typeof admin === 'object') {
                replyAdminId = admin.getId()?.toString();
            }

            if (replyAdminId !== currentAdminId) {
                throw new NotFoundError('You cannot delete this reply');
            }

            const parentComment = foundReply.getParentComment();

            const deleted = await Repository.LifehackComments().deleteById(replyId);

            if (deleted && parentComment) {
                let parentCommentId: Types.ObjectId;

                if (parentComment instanceof Types.ObjectId) {
                    parentCommentId = parentComment;
                } else {
                    parentCommentId = parentComment.getId();
                }

                await Repository.LifehackComments().decrementReplyCount(parentCommentId);
                const parent = await Repository.LifehackComments().getById(parentCommentId);

                if ((parent.getReplyCount() || 0) === 0) {
                    parent.buildReplied(false);
                    await Repository.LifehackComments().update(parent);
                }
            }

            return context.send.data({ deleted });
        } catch (error) {
            return context.send.error(error);
        }
    }
}