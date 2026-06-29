import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, UserStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/customer')
export default class DeleteCustomerProfileController {
  @request('delete', '/{customerId}')
  @summary('Customer delete')
  @security([])
  @tags(['Customer'])
  @path({ customerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.customerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const customer = await Repository.Users().getById(new Types.ObjectId(params.id));
      if (!customer) {
        throw new NotFoundError('Customer');
      }
      const before = await Repository.Users().findOneRaw(new Types.ObjectId(params.id));
      customer.buildStatus(UserStatusEnum.DELETED);
      await Repository.Users().update(customer);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Customer',
        resourceId: customer.getId(),
        before
      });
      return context.send.data({ deleted: params.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'Customer',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
