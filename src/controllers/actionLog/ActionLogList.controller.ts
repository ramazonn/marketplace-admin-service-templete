import { Context } from 'koa';
import { Types } from 'mongoose';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogListParams, ListParams } from '../../infrastructure';
import { Repository } from '@ubaytools/core';

// Utility function to remove null or undefined values from an object
const removeNullValues = (obj: any) => {
    Object.keys(obj).forEach((key) => {
        if (obj[key] === null || obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj;
};

class ActionLogResponse {
    id: string;
    actor: { id: string; fullName: string } | null;
    actorName?: string;
    action: string;
    resource: string;
    resourceId?: string;
    scope?: string;
    role?: string;
    endpoint?: string;
    status?: string;
    failureReason?: string;
    changes?: Record<string, any>;
    before?: Record<string, any>;
    after?: Record<string, any>;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    createdAt?: Date;

    constructor(actionLog: any, actor: any = null) {
        this.id = actionLog.getId().toString();
        this.actor = actor
            ? {
                id: actor.getId().toString(),
                fullName:
                    actor.getFullName?.() ||
                    [actor.getFirstName?.(), actor.getLastName?.()].filter(Boolean).join(' '),
            }
            : null;

        this.actorName = actionLog.getActorName?.();
        this.action = actionLog.getAction?.();
        this.resource = actionLog.getResource?.();
        this.resourceId = actionLog.getResourceId?.()?.toString?.();
        this.scope = actionLog.getScope?.();
        this.role = actionLog.getRole?.();
        this.endpoint = actionLog.getEndpoint?.();
        this.status = actionLog.getStatus?.();
        this.failureReason = actionLog.getFailureReason?.();
        this.changes = actionLog.getChanges?.();
        this.before = actionLog.getBefore?.();
        this.after = actionLog.getAfter?.();
        this.errorMessage = actionLog.getErrorMessage?.();
        this.ipAddress = actionLog.getIpAddress?.();
        this.userAgent = actionLog.getUserAgent?.();
        this.requestId = actionLog.getRequestId?.();
        this.createdAt = actionLog.getCreatedAt?.();

        removeNullValues(this);
    }
}

@prefix('/action-log')
export default class ActionLogListController {
    @request('get', '/list')
    @summary('Action log list')
    @security([])
    @tags(['ActionLog'])
    @query((ListParams as any).swaggerDocument)
    @query((ActionLogListParams as any).swaggerDocument)
    static async controller(context: Context): Promise<void> {
        let listParams: ListParams;
        let params: ActionLogListParams;

        try {
            listParams = await new ListParams(context.request.query).validate();
            params = await new ActionLogListParams(context.request.query).validate();
        } catch (error) {
            const joiError = await context.joi.handle(error);
            return context.send.error(joiError);
        }

        try {
            const filter: any = {};

            if (params.admin) {
                filter.actor = new Types.ObjectId(params.admin);
            }

            if (params.actorName) {
                filter.actorName = { $regex: params.actorName, $options: 'i' };
            }

            if (params.action) {
                filter.action = params.action;
            }

            if (params.status) {
                filter.status = params.status;
            }

            const total = await Repository.ActionLogs().countDocumentsByFilter(filter);
            const logs = await Repository.ActionLogs().list(
                { page: listParams.page, size: listParams.size },
                filter,
                { createdAt: -1 },
            );
            const items = await Promise.all(
                logs.map(async (log: any) => {
                    let actor = null;
                    const actorId = log.getActor?.();
                    if (actorId) {
                        try {
                            actor = await Repository.Admins().getById(new Types.ObjectId(actorId.toString()));
                        } catch (e) {
                            actor = null;
                        }
                    }
                    return new ActionLogResponse(log, actor);
                }),
            );

            return context.send.data({
                total,
                items,
            });
        } catch (error) {
            return context.send.error(error);
        }
    }
}