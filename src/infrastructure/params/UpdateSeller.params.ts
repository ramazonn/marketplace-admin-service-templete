import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { SellerTypeEnum } from '@ubaytools/core';

@swaggerClass()
export class UpdateSellerParams {
  @swaggerProperty({ type: 'string' }) admin: string;
  @swaggerProperty({ type: 'string' }) firstName: string;
  @swaggerProperty({ type: 'string' }) lastName: string;
  @swaggerProperty({ type: 'string' }) middleName: string;
  @swaggerProperty({ type: 'string' }) fullName: string;
  @swaggerProperty({ type: 'string' }) phoneNumber: string;
  @swaggerProperty({ type: 'string', required: false, example: SellerTypeEnum.MCHJ, description: Object.values(SellerTypeEnum).join('|') })
  type: SellerTypeEnum;
  @swaggerProperty({ type: 'string' }) passportSeries: string;
  @swaggerProperty({ type: 'string' }) passportNumber: string;
  @swaggerProperty({ type: 'string' }) bankMfo: string;
  @swaggerProperty({ type: 'string' }) bankAccount: string;
  @swaggerProperty({ type: 'string' }) address: string;

  constructor(params: any) {
    if (params) {
      this.admin = params?.admin
      this.firstName = params?.firstName;
      this.lastName = params?.lastName;
      this.middleName = params.middleName;
      this.fullName = params?.fullName;
      this.phoneNumber = params?.phoneNumber;
      this.passportSeries = params?.passportSeries;
      this.passportNumber = params?.passportNumber;
      this.bankMfo = params?.bankMfo;
      this.bankAccount = params?.bankAccount;
      this.address = params?.address;
    }
  }

  async validate() {
    return await UpdateSellerParamsSchema.validateAsync(this);
  }
}

export const UpdateSellerParamsSchema = Joi.object<UpdateSellerParams>({
  admin: Joi.string().trim().optional(),
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  middleName: Joi.string().trim().optional(),
  fullName: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  passportSeries: Joi.string().trim().optional(),
  passportNumber: Joi.string().trim().optional(),
  bankMfo: Joi.string().trim().optional(),
  bankAccount: Joi.string().trim().optional(),
  address: Joi.string().trim().optional(),
});
