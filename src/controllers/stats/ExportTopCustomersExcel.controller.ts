import { LanguageEnum, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { header, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { ListParams } from '../../infrastructure';
import { buildExcelBuffer } from '../../utils/excel';

@prefix('/stats')
export default class ExportTopCustomersExcelController {

  @request('post', '/top-customers/download-excel')
  @summary('Download Excel of Top Customers')
  @security([])
  @tags(['Statistics'])
  @header({
    'content-language': {
      type: 'string',
      example: LanguageEnum.RU,
      description: 'values: ' + Object.values(LanguageEnum).join(' | ')
    },
  })
  static async controller(context: Context): Promise<void> {
    try {
      const users = await Repository.Users().list(
        {},
        {},
        { "userStats.ordersCount": -1 }
      );

      const excelData = users.map((user, index) => ({
        Rank: index + 1,
        ID: user.getId(),
        FirstName: user.getUserInfo()?.getFirstname() ?? "",
        LastName: user.getUserInfo()?.getLastname() ?? "",
        PhoneNumber: user.getPhoneNumber(),
        OrdersCount: user.getUserStats()?.getOrdersCount() ?? 0
      }));

      const buffer = buildExcelBuffer(excelData, 'Top Customers');

      context.set('Content-Disposition', 'attachment; filename="top-customers.xlsx"');
      context.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.body = buffer;

    } catch (error) {
      return context.send.error(error);
    }
  }
}
