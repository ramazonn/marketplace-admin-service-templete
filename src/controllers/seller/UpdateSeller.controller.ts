import { Context } from 'koa';
import { IdParams, UpdateSellerParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/seller')
export default class UpdateSellerController {
  @request('put', '/{sellerId}')
  @summary('Seller update')
  @security([])
  @tags(['Seller'])
  @body((UpdateSellerParams as any).swaggerDocument)
  @path({ sellerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateSellerParams;
    try {
      idParams = await new IdParams({ id: context.params.sellerId }).validate();
      params = await new UpdateSellerParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const seller = await Repository.Sellers().getById(new Types.ObjectId(idParams.id));
      if (!seller) {
        throw new NotFoundError('Seller');
      }
      const before = await Repository.Sellers().findOneRaw(new Types.ObjectId(idParams.id));

      if (params.admin) {
        const exists = await Repository.Sellers().findOneRaw({
          admin: params.admin,
          _id: { $ne: seller.getId() },
        });

        if (!exists) {
          seller.buildAdmin(new Types.ObjectId(params.admin));
        }
      }
      if (params.firstName) seller.buildFirstname(params.firstName);
      if (params.lastName) seller.buildLastname(params.lastName);
      if (params.middleName) seller.buildMiddleName(params.middleName);
      if (params.fullName) seller.buildFullname(params.fullName);
      if (params.phoneNumber) seller.buildPhoneNumber(params.phoneNumber);
      if (params.passportSeries) seller.buildPassportSeries(params.passportSeries);
      if (params.passportNumber) seller.buildPassportNumber(params.passportNumber);
      if (params.bankMfo) seller.buildBankMFO(params.bankMfo);
      if (params.bankAccount) seller.buildBankAccount(params.bankAccount);
      if (params.address) seller.buildAddress(params.address);

      const after = await Repository.Sellers().update(seller);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Seller',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Seller',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
