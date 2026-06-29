import { Context } from 'koa';
import { CustomerListParams, ListParams } from '../../infrastructure';
import { GenderEnum, UserEntity, LanguageEnum, Repository, UserAddressEntity, UserStatusEnum } from '@ubaytools/core';
import { path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
export class CustomerItemResponse {
  id: string;
  registerDate: Date;
  phoneNumber: string;
  firstname: string;
  lastname: string;
  middlename: string;
  avatar: string;
  birthdate: Date;
  gender: GenderEnum;
  email: string;
  addresses: Array<any>;
  status: UserStatusEnum;
  ordersCount: number;
  // TODO add locations

  constructor(customer: UserEntity,customerAddress:UserAddressEntity[], lang: LanguageEnum) {
    const customerInfo = customer.getUserInfo();
    this.id = customer.getId().toString();
    this.registerDate = customer.getCreatedAt();
    this.phoneNumber = customer.getPhoneNumber();
    this.firstname = customerInfo?.getFirstname();
    this.lastname = customerInfo?.getLastname();
    this.middlename = customerInfo?.getMiddlename();
    this.avatar = customerInfo?.getAvatar(); // TODO use cdn env path
    this.birthdate = customerInfo?.getBirthdate();
    this.gender = customerInfo?.getGender();
    this.email = customerInfo?.getEmail();
    this.addresses = customerAddress.map(address => {
      return {
        id: address.getId(),
        city: address.getCity(),
        district: address.getDistrict(),
        address: address.getAddress(),
        latitude: address.getLatitude(),
        longitude: address.getLongitude()        
      }
    })
    this.status = customer.getStatus();
    this.ordersCount = customer.getUserStats().getOrdersCount()
   
  }
}
@prefix('/customer')
export default class CustomerListController {
  @request('get', '/list')
  @summary('Customer profile')
  @security([])
  @tags(['Customer'])
  @query((CustomerListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: CustomerListParams; // TODO refactor for filtering params
    try {
      params = await new CustomerListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter = { status: { $ne: UserStatusEnum.DELETED } };
      if (params.search)
        filter['$or'] = [
          { phoneNumber: { $regex: params.search, $options: 'i' } },
          { 'userInfo.email': { $regex: params.search, $options: 'i' } },
          { 'userInfo.firstname': { $regex: params.search, $options: 'i' } },
          { 'userInfo.lastname': { $regex: params.search, $options: 'i' } },
          { 'userInfo.middlename': { $regex: params.search, $options: 'i' } },
        ];
      const dateFilter = params.getDateFilter();
      Object.assign(filter, dateFilter);

      const count = await Repository.Users().countDocumentsByFilter(filter);
      const customers = await Repository.Users().list({ page: params.page, size: params.size }, filter);
      const response = await Promise.all(customers.map(async(customer) => {
        const customerAddresses = await Repository.UserAddress().list({}, { user: customer.getId() });
        return new CustomerItemResponse(customer, customerAddresses, context.lang);
      }))
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
