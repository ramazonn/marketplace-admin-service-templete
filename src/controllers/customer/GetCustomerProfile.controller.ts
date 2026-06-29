import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { LanguageEnum, NotFoundError, Repository, UserEntity, GenderEnum, UserStatusEnum, UserAddressEntity, OrderModel } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

export class CustomerResponse {
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
  deliveredOrdersCount: number;
  deliveredOrdersAmount: number;
  orderStats:any
  // TODO add locations

  constructor(customer: UserEntity,customerAddress:UserAddressEntity[],orderStats:any, lang: LanguageEnum) {
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
    const delivered = orderStats.find((s) => s.status === 'DELIVERED') || { count: 0, totalAmount: 0 };
      const totalDeliveredCount = delivered.count;
      const totalDeliveredAmount = delivered.totalAmount;
    this.deliveredOrdersCount = totalDeliveredCount
    this.deliveredOrdersAmount = totalDeliveredAmount
    this.orderStats=orderStats
  }
}
@prefix('/customer/detail')
export default class GetCustomerProfileController {
  @request('get', '/{customerId}')
  @summary('Customer profile')
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
      const customerAddresses = await Repository.UserAddress().list({}, { user: customer.getId() });
      const statuses = [
        'PENDING',
        'PROCESSING',
        'PACKAGING',
        'SHIPPED',
        'READY_TO_PICKUP',
        'DELIVERED',
        'CANCELLED'
      ];
      let orderStats = await OrderModel.aggregate([
        {
          $match: {
            user: new Types.ObjectId(params.id),
            status: { $in: statuses }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" }
          }
        }
      ]);
      
      const statsMap = new Map(
        orderStats.map((s) => [s._id, { count: s.count, totalAmount: s.totalAmount }])
      );
      const fullStats = statuses.map((status) => ({
        status,
        count: statsMap.get(status)?.count || 0,
        totalAmount: statsMap.get(status)?.totalAmount || 0,
      }));
      
      result = new CustomerResponse(customer, customerAddresses,fullStats, context.lang);

      return context.send.data(result);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
