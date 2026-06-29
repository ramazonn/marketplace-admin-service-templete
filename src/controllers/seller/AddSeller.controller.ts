import { Context } from 'koa';
import { AddSellerParams, AddStoreParams, AlreadyExistsError } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, Repository, SellersEntity, SellerTypeEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';
import { Types } from 'mongoose';

export class AddSellerResponse {
  id: string;
  constructor(seller: SellersEntity) {
    this.id = seller.getId().toString();
  }
}

@prefix('/seller')
export default class AddSellerController {
  @request('post', '/add')
  @summary('Seller add')
  @security([])
  @tags(['Seller'])
  @body((AddSellerParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddSellerParams;
    try {
      params = await new AddSellerParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const SellerAdmin = await Repository.Sellers().list({}, { admin: params.admin }, {})

      if(SellerAdmin) {
        throw new AlreadyExistsError('Admin')
      }
      const sellerEntity = new SellersEntity()
        .buildAdmin(new Types.ObjectId(params.admin))
        .buildType(SellerTypeEnum[params.type])
        .buildFirstname(params.firstName)
        .buildLastname(params.lastName)
        .buildMiddleName(params.middleName)
        .buildFullname(params.fullName)
        .buildPhoneNumber(params.phoneNumber)
        .buildPassportSeries(params.passportSeries)
        .buildPassportNumber(params.passportNumber)
        .buildBankMFO(params.bankMfo)
        .buildBankAccount(params.bankAccount)
        .buildAddress(params.address);
      const seller = await Repository.Sellers().create(sellerEntity);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Seller',
        resourceId: seller.getId(),
        after: seller.convertToSchema() as unknown as Record<string, unknown>
      });
      const response = new AddSellerResponse(seller);
      return context.send.data(response);
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Seller',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
