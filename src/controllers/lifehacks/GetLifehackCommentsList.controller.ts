import { Context } from 'koa';
import { query, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import {
    CloudFlareService,
    LifehackCommentTypeEnum,
    NotFoundError,
    Repository,
    UserEntity,
} from '@ubaytools/core';
import { IdParams, ListParams } from '../../infrastructure';

class LifehackCommentsListItemResponse {
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    replyCount: number;
    replied: boolean;
    user: {
        id: string;
        firstName?: string;
        lastName?: string;
        avatar?: string | null;
    } | null;

    constructor(comment: any) {
        this.id = comment.getId()?.toString();
        this.text = comment.getText();
        this.createdAt = comment.getCreatedAt();
        this.updatedAt = comment.getUpdatedAt();
        this.replyCount = comment.getReplyCount() || 0;
        this.replied = comment.getReplied();

        const user = comment.getUser();

        if (user && !(user instanceof Types.ObjectId)) {
            this.user = {
                id: user.getId()?.toString(),
                firstName: user.getUserInfo?.().getFirstname?.() || '',
                lastName: user.getUserInfo?.().getLastname?.() || '',
                avatar: user.getUserInfo?.().getAvatar?.()
                    ? CloudFlareService.getImageUrlByFileID(user.getUserInfo?.().getAvatar())
                    : null,
            };
        } else {
            this.user = null;
        }
    }
}

@prefix('/lifehacks')
export default class GetLifehackCommentsListController {
    @request('get', '/comments-list/{lifehackId}')
    @summary('Lifehack comments list')
    @security([])
    @tags(['Lifehacks'])
    @path({ lifehackId: { type: 'string', required: true } })
    @query((ListParams as any).swaggerDocument)
    static async controller(context: Context): Promise<void> {
        let idParams: IdParams;
        let listParams: ListParams;

        try {
            idParams = await new IdParams({
                id: context.params.lifehackId,
            }).validate();

            listParams = await new ListParams(context.query).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const lifehackId = new Types.ObjectId(idParams.id);

            const foundLifehack = await Repository.Lifehacks().getById(lifehackId);
            if (!foundLifehack) {
                throw new NotFoundError('Lifehack');
            }

            const filter = {
                lifehack: lifehackId,
                type: LifehackCommentTypeEnum.COMMENT,
            };

            const comments = await Repository.LifehackComments().list(
                {
                    page: listParams.page,
                    size: listParams.size,
                },
                filter,
                { createdAt: -1 },
            );

            const commentsCount = await Repository.LifehackComments().countDocumentsByFilter(filter);

            return context.send.data({
                comments: comments.map(
                    (comment) => new LifehackCommentsListItemResponse(comment),
                ),
                commentsCount,
            });
        } catch (error) {
            return context.send.error(error);
        }
    }
}