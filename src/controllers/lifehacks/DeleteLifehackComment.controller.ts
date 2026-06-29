import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/lifehacks')
export default class DeleteLifehackCommentController {
    @request('delete', '/comment-delete/{commentId}')
    @summary('Delete lifehack comment')
    @security([])
    @tags(['Lifehacks'])
    @path({ commentId: { type: 'string', required: true } })
    static async controller(context: Context): Promise<void> {
        let idParams: IdParams;

        try {
            idParams = await new IdParams({ id: context.params.commentId }).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const commentId = new Types.ObjectId(idParams.id);

            const comment = await Repository.LifehackComments().getById(commentId);
            if (!comment) {
                throw new NotFoundError('Lifehack comment');
            }

            await Repository.LifehackComments().deleteManyByFilter({
                parentComment: comment.getId() as Types.ObjectId,
            });

            const deleted = await Repository.LifehackComments().deleteById(commentId);

            if (deleted) {
                await Repository.Lifehacks().decrementCommentsCount(
                    comment.getLifehack() as Types.ObjectId,
                );
            }

            return context.send.data({ deleted });
        } catch (error) {
            return context.send.error(error);
        }
    }
}