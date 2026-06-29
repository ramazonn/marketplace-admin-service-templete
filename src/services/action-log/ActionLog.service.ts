import { Context } from 'koa';
import {
  ActionLogEntity,
  ActionLogStatusEnum,
  ActionTypeEnum,
  Repository,
} from '@ubaytools/core';
import { ActionLogNormalizer } from './ActionLogNormalizer';
import {
  ActionLogParams,
  ContextMeta,
  NormalizedLogData,
} from '../../infrastructure/interfaces/action-log.interface';

export class ActionLogService {
  static async logSuccess(params: ActionLogParams): Promise<void> {
    const meta = this.extractContextMeta(params.context);
    const normalized = this.normalizeSuccessPayload(params);

    if (params.action === ActionTypeEnum.UPDATE && !normalized.changes) {
      return;
    }
    const entity = new ActionLogEntity()
      .buildActor(meta.actor)
      .buildActorName(meta.actorName)
      .buildRole(meta.role)
      .buildAction(params.action)
      .buildResource(params.resource)
      .buildResourceId(params.resourceId)
      .buildEndpoint(meta.endpoint)
      .buildScope(meta.scope)
      .buildStore(meta.store)
      .buildStatus(ActionLogStatusEnum.SUCCESS)
      .buildIpAddress(meta.ipAddress)
      .buildUserAgent(meta.userAgent)
      .buildRequestId(meta.requestId);

    if (normalized.before !== undefined) {
      entity.buildBefore(normalized.before);
    }

    if (normalized.after !== undefined) {
      entity.buildAfter(normalized.after);
    }

    if (normalized.changes !== undefined && Object.keys(normalized.changes).length > 0) {
      entity.buildChanges(normalized.changes);
    }

    await Repository.ActionLogs().create(entity);
  }

  static async logFailure(params: ActionLogParams): Promise<void> {
    const meta = this.extractContextMeta(params.context);

    const entity = new ActionLogEntity()
      .buildActor(meta.actor)
      .buildActorName(meta.actorName)
      .buildRole(meta.role)
      .buildAction(params.action)
      .buildResource(params.resource)
      .buildResourceId(params.resourceId)
      .buildEndpoint(meta.endpoint)
      .buildScope(meta.scope)
      .buildStore(meta.store)
      .buildStatus(ActionLogStatusEnum.FAILED)
      .buildFailureReason(params.failureReason)
      .buildErrorMessage(params.errorMessage)
      .buildIpAddress(meta.ipAddress)
      .buildUserAgent(meta.userAgent)
      .buildRequestId(meta.requestId);

    await Repository.ActionLogs().create(entity);
  }

  private static extractContextMeta(context?: Context): ContextMeta {
    const method =
      context?.method ??
      context?.request?.method ??
      context?.req?.method;

    const path =
      context?.path ??
      context?.originalUrl ??
      context?.request?.url ??
      context?.req?.url;

    return {
      actor: context?.auth?.admin?._id,
      actorName:
        context?.auth?.admin?.fullName ??
        context?.state?.actorName ??
        [
          context?.auth?.admin?.getFirstName?.(),
          context?.auth?.admin?.getLastName?.(),
        ]
          .filter(Boolean)
          .join(' '),
      role: context?.auth?.role?.code ?? context?.role?.code ?? context?.state?.role,
      endpoint: method && path ? `${method} ${path}` : undefined,
      scope: context?.auth?.scope,
      store: context?.auth?.store?._id ?? context?.auth?.store,
      ipAddress: context?.ip,
      userAgent:
        typeof context?.headers?.['user-agent'] === 'string'
          ? context.headers['user-agent']
          : typeof context?.request?.header?.['user-agent'] === 'string'
            ? context.request.header['user-agent']
            : undefined,
      requestId: context?.state?.requestId,
    };
  }

  private static normalizeSuccessPayload(params: ActionLogParams): NormalizedLogData {
    switch (params.action) {
      case ActionTypeEnum.CREATE:
        return {
          after: ActionLogNormalizer.normalizeLogData(params.after),
        };

      case ActionTypeEnum.DELETE:
        return {
          before: ActionLogNormalizer.normalizeLogData(params.before),
        };

      case ActionTypeEnum.UPDATE: {
        const changes = ActionLogNormalizer.extractChanges(params.before, params.after);

        if (!changes || Object.keys(changes).length === 0) {
          return {};
        }

        return { changes };
      }

      default:
        return {};
    }
  }
}