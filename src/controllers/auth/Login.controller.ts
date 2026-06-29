import { request, summary, tags, security, prefix, body, responses } from 'koa-swagger-decorator';
import { Context } from 'koa';

import { ActionLogFailureReasonEnum, ActionTypeEnum, BaseCaseParamsInterface } from '@ubaytools/core';
import { AuthLoginParams } from '../../infrastructure';
import { createSessionCase, CreateSessionCaseParams } from '../../usecases';
import { string } from 'joi';
import { ActionLogService } from '../../services';

@prefix('/auth')
export default class LoginController {
  @request('post', '/login')
  @summary('Login admin')
  @tags(['Auth'])
  @body({
    username: { type: 'string', description: 'username', example: 'admin' },
    password: { type: 'string', description: 'password', example: 'admin' },
  })
  static async controller(context: Context): Promise<void> {
    let params: AuthLoginParams;
    try {
      console.log(context.request.body);
      params = await new AuthLoginParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const sessionParams: BaseCaseParamsInterface<CreateSessionCaseParams> = {
        refId: context.refId,
        client: context?.client?.getId(),
        username: params.username,
        password: params.password,
      };
      const result = await createSessionCase.execute(sessionParams);
      await ActionLogService.logSuccess({
        context: {
          ...context,
          auth: {
            ...context.auth,
            admin: {
              fullName: [result.firstName, result.lastName].filter(Boolean).join(' '),
              getFirstName: () => result.firstName,
              getLastName: () => result.lastName,
            },
            role: result.role,
            scope: result?.role?.scope,
          },
        } as any,
        action: ActionTypeEnum.LOGIN,
        resource: 'auth',
        after: { username: params.username, },
      });
      return context.send.data(result);
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
  }
}
