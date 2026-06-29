import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { UpdateCustomerParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/customer')
export default class UpdateCustomerProfileController {
  @request('put', '/{customerId}')
  @summary('Customer update profile')
  @security([])
  @tags(['Customer'])
  @path({ customerId: { type: 'string', required: true } })
  @body((UpdateCustomerParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateCustomerParams; // TODO add extra update params
    try {
      params = await new UpdateCustomerParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.customerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const customer = await Repository.Users().getById(new Types.ObjectId(idParams.id));
      if (!customer) {
        throw new NotFoundError('Customer');
      }
      const before = await Repository.Users().findOneRaw(new Types.ObjectId(idParams.id));

      customer.buildStatus(params.status).buildPhoneNumber(params.phoneNumber);
      const updated = await Repository.Users().update(customer);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Customer',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: idParams.id });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Customer',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
