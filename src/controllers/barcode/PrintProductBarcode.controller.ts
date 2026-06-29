import { Context } from 'koa';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { PrintBarcodeParams } from '../../infrastructure';

@prefix('/barcode')
export default class PrintProductBarcodeController {
  @request('post', '/print-product-barcode')
  @summary('Barcodes print to excel file')
  @security([])
  @tags(['Barcode'])
  @body((PrintBarcodeParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: PrintBarcodeParams;
    let result;
    try {
      params = await new PrintBarcodeParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      // result = await printProductBarcodeCase().execute(params);  // TODO implement print case
      return context.send.data({ printed: true });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
