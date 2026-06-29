import { Context } from 'koa';
import { RequiredDateFilterParams } from '../../infrastructure';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { OrderModel } from '@ubaytools/core';
import * as XLSX from 'xlsx';
import { SAPService } from '../../services';

@prefix('/orders')
export default class DownloadOrderItemsInExcelIncludingSapPriceController {
  @request('post', '/items-excel-download')
  @summary('Download order items in Excel')
  @security([])
  @tags(['Orders'])
  @query((RequiredDateFilterParams as any).swaggerDocument)

  static async controller(context: Context): Promise<void> {
    let params: RequiredDateFilterParams;
    try {
      params = await new RequiredDateFilterParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const matchStage: any = { status: 'DELIVERED', deliveredAt : { $gte: params.startDate, $lte: params.endDate } };
      
      const stats = await OrderModel.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $addFields: {
            'items.productId': {
              $cond: {
                if: { $eq: [{ $type: '$items.productId' }, 'string'] },
                then: { $toObjectId: '$items.productId' },
                else: '$items.productId'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "stores",
            localField: "productInfo.store",
            foreignField: "_id",
            as: "storeInfo"
          }
        },
        { $unwind: { path: "$storeInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            itemCode: { $first: '$productInfo.itemCode' },
            price: { $first: '$items.price' },
            discountPrice: { $first: '$items.discountPrice' },
            usdRate: { $first: "$storeInfo.usd_rate" },
            count: { $sum: '$items.quantity' },
            totalPrice: {
              $sum: {
                $multiply: [
                  '$items.quantity',
                  {
                    $cond: [
                      {
                        $and: [
                          { $gt: ['$items.discountPrice', 0] },
                          { $ne: ['$items.discountPrice', null] }
                        ]
                      },
                      '$items.discountPrice',
                      '$items.price'
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            itemCode: 1,
            productName: 1,
            price: 1,
            discountPrice: 1,
            usdRate: 1,
            count: 1,
            totalPrice: { $round: ['$totalPrice', 2] }
          }
        },
        { $sort: { totalPrice: -1 } }
      ]);
      
    
      const workbook = XLSX.utils.book_new();
      const worksheetData = [
        ['Product ID', 'Sap code', 'Mahsulot nomi','Dollor kursi', 'Sap USD narx','UPrice1', 'Narx somda','Sotishdagi narxi', 'Chegirma narxi', 'Soni', 'Umimiy narxi', ]
      ];
      await Promise.all(stats.map(async (e) => {
        const itemCode = e.itemCode;

        const sapResult = await SAPService.getInstance().getProductItem({ itemCode });
        e.UPrice1 = sapResult?.data?.U_price1 ?? 0;
        const mainPrice = sapResult?.data?.ItemPrices?.find((price) => price.Currency === 'USD');
        console.log(sapResult?.data?.U_price1,mainPrice);
        
        if (!mainPrice) {
          return;
        }        

        const storeUsdRate = e.usdRate;
        const priceInSoum = Math.round(mainPrice.Price * storeUsdRate);
        e.UsdPrice = mainPrice.Price;
        e.priceInSoum = priceInSoum;

      }))
      
      stats.forEach((p) => {
        worksheetData.push([
          p.productId?.toString() || '',
          p.itemCode || '',
          p.productName || '',
          p.usdRate || '',
          p.UsdPrice||'',
          p.UPrice1 || '',
          p.priceInSoum||'',
          p.price || 0,
          p.discountPrice || 0,
          p.count || 0,
          p.totalPrice || 0,

        ]);
      });
    
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Stats');
    
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      context.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      context.set('Content-Disposition', `attachment; filename=OrderItems.xlsx`);

      context.body = excelBuffer;
    } catch (error) {
      return context.send.error(error);
    }
  }
}
