import { Context } from 'koa';
import { AddProductParams } from '../../infrastructure';
import { BadRequestError, ProductEntity, ProductInfoEntity, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, params, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { GenerateProductsExcelUseCase } from '../../usecases/product/GenerateProductExcel.usecase';

@prefix('/product')
export default class DownloadProductsInExcel {
  @request('post', '/list/download-excel')
  @summary('Product add')
  @security([])
  @tags(['Product'])
  // @body((AddProductParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    // let params: AddProductParams;
    try {
      // params = await new AddProductParams(context.request.body).validate();
    } catch (error) {
      // const joiError = await context.joi.handle(error);
      // return context.send.error(joiError);
    }
    try {

      const excelBuffer = await GenerateProductsExcelUseCase.execute();

      // Set response headers
      context.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      context.set('Content-Disposition', `attachment; filename=Products_${Date.now()}.xlsx`);

      // Send the Excel file
      context.body = excelBuffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
