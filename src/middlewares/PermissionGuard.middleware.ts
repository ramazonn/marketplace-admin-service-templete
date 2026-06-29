import { Context, Next } from 'koa';
import { Middleware } from '@koa/router';
import { AuthorizationError } from '../infrastructure';
import { ActionLogService } from '../services';
import { ActionLogFailureReasonEnum, ActionTypeEnum } from '@ubaytools/core';

export function PermissionGuard(...required: number[]): Middleware {
  return async (context: Context, next: Next): Promise<void> => {
    try {
      const auth = context.auth;
      if (!auth?.admin) {
        throw new AuthorizationError('Unauthorized');
      }

      // Vaqtinchalik agar role biriktirilmasa permission bo'lmaydi shuni uchun uni ta'xtatmasdan o'tqazib yuboramiz
      if (auth?.permissions?.size == 0) {
        await next();
        return;
      }

      if (!auth?.permissions) {
        throw new AuthorizationError('Permissions not loaded');
      }

      if (auth.permissions.has(0)) {
        await next();
        return;
      }

      if (!required.length) {
        await next();
        return;
      }

      const hasPermission = required.some((p) =>
        auth.permissions.has(p)
      )

      if (!hasPermission) {
        throw new AuthorizationError('Forbidden');
      }

      await next();
    } catch (error) {
      const isForbidden = error?.message === 'Forbidden';

      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.ACCESS,
        resource: 'permission',
        failureReason: isForbidden
          ? ActionLogFailureReasonEnum.FORBIDDEN
          : ActionLogFailureReasonEnum.AUTH_FAILED,
        errorMessage: error?.message,
      });
      return context.send.error(error);
    }
  };
}