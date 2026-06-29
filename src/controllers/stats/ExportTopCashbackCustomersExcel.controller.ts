import { LanguageEnum, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { body, header, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { buildExcelBuffer } from '../../utils/excel';
import { Types } from 'mongoose';
import { GetTopCashbackCustomersParams } from '../../infrastructure';

@prefix('/stats')
export default class ExportTopCashbackCustomersExcelController {

  
  @request('post', '/top-cashback-earned-customers/download-excel')
  @summary('Download Excel of Top Cashback Customers')
  @security([])
  @tags(['Statistics'])
  @header({
    'content-language': {
      type: 'string',
      example: LanguageEnum.RU,
      description: 'values: ' + Object.values(LanguageEnum).join(' | ')
    }
  })
  @body((GetTopCashbackCustomersParams as any).swaggerDocument)


  static async controller(context: Context): Promise<void> {
    let params: GetTopCashbackCustomersParams;
    try {
      params = await new GetTopCashbackCustomersParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }


    try {

      const filter: any = {};

      if (params.store) {
        filter.store = new Types.ObjectId(params.store);
      }
      const customers = await Repository.UserCashback().list(
        {},
        filter,
        { cashbackAmount: -1 }
      );

      const userIds = Array.from(
        new Set(customers.map(c => String(c.getUser())))
      ).map(id => new Types.ObjectId(id));

      const users = await Repository.Users().list(
        {},
        { _id: { $in: userIds } },
        { cashbackAmount: -1 }
      );

      const userById = new Map(users.map(u => [String(u.getId()), u]));

      const excelData = customers.map((customer, index) => {
        const user = userById.get(String(customer.getUser()));

        return {
          Rank: index + 1,
          ID: customer.getId(),
          FirstName: user?.getUserInfo()?.getFirstname() ?? "",
          LastName: user?.getUserInfo()?.getLastname() ?? "",
          PhoneNumber: user?.getPhoneNumber() ?? "",
          CashbackAmount: customer.getCashbackAmount(),
        };
      });

      const buffer = buildExcelBuffer(excelData, 'Top Cashback Customers');

      context.set('Content-Disposition', 'attachment; filename="top-cashback-customers.xlsx"');
      context.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.body = buffer;

    } catch (error) {
      return context.send.error(error);
    }
  }
}
