import { Types } from 'mongoose';
import { LanguageEnum, ProductsModel, } from '@ubaytools/core';
import { CarouselProductItemResponse } from './CarouselProductItem.response';

export class GetCarouselProductDetailUseCase {
 
  static async execute(
    productIds: string[],
    lang: LanguageEnum,
  ): Promise<any[]> {
    if (!productIds || productIds.length === 0) return [];

    const objectIds = productIds.map((id) => new Types.ObjectId(id));

    const aggregatePipeline = [
      {
        $match: { _id: { $in: objectIds } },
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'storeInfo',
          
        },
      },
      {
        $addFields: {
          store: { $arrayElemAt: ['$storeInfo', 0] },
        }
      }
      
    ];

    const results = await ProductsModel.aggregate(aggregatePipeline);

              
    if (!results || results.length === 0) {
      return [];
    }

    return results.map((product) => new CarouselProductItemResponse(product, lang));

  }
}
