import { Context, Next } from 'koa';
import { Middleware } from '@koa/router';

import { AuthorizationError } from '../infrastructure';
import { checkClientSessionByAccessTokenCase } from '../usecases';
import { ActionLogFailureReasonEnum, ActionTypeEnum, Redis, Repository } from '@ubaytools/core';
import { ActionLogService } from '../services';

export function CheckClientSessionMiddleware(): Middleware {
  return async (context: Context, next: Next): Promise<void> => {
    try {
      const authHeader = context.headers.authorization;
      if (!authHeader) throw new AuthorizationError('Authorization is required');

      const accessToken = authHeader.split(' ')[1];
      if (!accessToken) throw new AuthorizationError('AccessToken is required');

      const { admin, role, seller } = await checkClientSessionByAccessTokenCase.execute({ accessToken });

      context.admin = admin;
      context.role = role;
      context.seller = seller;

      const redis = await Redis.getInstance();
      const key = `${process.env.NODE_ENV}:role:${role?.code}:scope:${role?.scope}:permissions`;
      let permissionIds: number[] = [];

        const cachedStr = await redis.get(key).catch(() => null);
        if (cachedStr) {
          try {
            const parsed = JSON.parse(cachedStr);
            if (Array.isArray(parsed)) {
              permissionIds = parsed.map(Number).filter(Number.isFinite);
            }
          } catch {
          }
        }
      
        
        if (permissionIds.length === 0) {
          const roleEntity = await Repository.Roles().getById(role?.id as any);
          permissionIds = roleEntity?.getPermissions?.() ?? [];
          permissionIds = Array.isArray(permissionIds) ? permissionIds.map(Number).filter(Number.isFinite) : [];
          if (permissionIds.length > 0) {
            await redis.set(key, JSON.stringify(permissionIds), 60 * 60);
          }
        }
      
        context.auth = {
          admin,
          seller,
          adminName: `${admin.getFirstName()} ${admin.getLastName()}`,
          permissions: new Set<number>(permissionIds),
        };
      // 
      await next();
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.LOGIN,
        resource: 'auth',
        failureReason: ActionLogFailureReasonEnum.AUTH_FAILED,
        errorMessage: error?.message,
      });
      return context.send.error(error);
    }
  };
}