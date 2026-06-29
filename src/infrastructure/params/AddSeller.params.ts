import * as Joi from 'joi';
import { SellerTypeEnum } from '@ubaytools/core';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddSellerParams {
  @swaggerProperty({ type: 'string', required: true, example: '65f0c2b...' })
  admin: string;
  @swaggerProperty({ type: 'string' }) firstName: string;
  @swaggerProperty({ type: 'string' }) lastName: string;
  @swaggerProperty({ type: 'string' }) middleName: string;
  @swaggerProperty({ type: 'string' }) fullName: string;
  @swaggerProperty({ type: 'string' }) phoneNumber: string;
  @swaggerProperty({ type: 'string', required: true, example: SellerTypeEnum.MCHJ, description: Object.values(SellerTypeEnum).join('|') })
  type: SellerTypeEnum;
  @swaggerProperty({ type: 'string' }) passportSeries: string;
  @swaggerProperty({ type: 'string' }) passportNumber: string;
  @swaggerProperty({ type: 'string' }) bankMfo: string;
  @swaggerProperty({ type: 'string' }) bankAccount: string;
  @swaggerProperty({ type: 'string' }) address: string;

  constructor(params: any) {
    if (params) {
      this.admin = params?.admin;
      this.firstName = params?.firstName;
      this.lastName = params?.lastName;
      this.middleName = params.middleName;
      this.fullName = params?.fullName;
      this.phoneNumber = params?.phoneNumber;
      this.type = params?.type;
      this.passportSeries = params?.passportSeries;
      this.passportNumber = params?.passportNumber;
      this.bankMfo = params?.bankMfo;
      this.bankAccount = params?.bankAccount;
      this.address = params?.address;
    }
    if (!this.fullName) {
      this.fullName = this.lastName + ' ' + this.firstName + ' ' + this.middleName;
    }
  }

  async validate() {
    return await AddSellerParamsSchema.validateAsync(this);
  }
}

export const AddSellerParamsSchema = Joi.object<AddSellerParams>({
  admin: Joi.string().trim().required(),
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  middleName: Joi.string().trim().optional(),
  fullName: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().required(),
  type: Joi.string()
    .trim()
    .allow(...Object.values(SellerTypeEnum)),
  passportSeries: Joi.string().trim().required(),
  passportNumber: Joi.string().trim().required(),
  bankMfo: Joi.string().trim().required(),
  bankAccount: Joi.string().trim().required(),
  address: Joi.string().trim().optional(),
});
