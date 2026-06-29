import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { GenerateOrderExcelUseCase } from '../../usecases';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/orders')
export default class DownloadInExcelController {
  @request('post', '/{orderId}/excel/download')
  @summary('Download order details in Excel')
  @security([])
  @tags(['Orders'])
  @path({ orderId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    let result;
    try {
      params = await new IdParams({ id: context.params.orderId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const excelBuffer = await GenerateOrderExcelUseCase.execute(params.id);

      // Set response headers
      context.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      context.set('Content-Disposition', `attachment; filename=Order_${params.id}.xlsx`);

      // Send the Excel file
      context.body = excelBuffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
