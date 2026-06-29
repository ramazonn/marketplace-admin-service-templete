import { Types } from 'mongoose';
import { LanguageEnum, NotFoundError, Repository, ProductsModel, StoresEntity } from '@ubaytools/core';
import { ProductItemResponse } from './ProductItem.response';
import { CarouselProductItemResponse } from './CarouselProductItem.response';

export class GetProductDetailUseCase {
  static async execute(productId: string, lang: LanguageEnum, userId?: string): Promise<ProductItemResponse> {
    const aggregatePipeline = [
      {
        $match: { _id: new Types.ObjectId(productId) },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'reviews',
        },
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
        $lookup: {
          from: 'products',
          localField: 'store',
          foreignField: 'store',
          as: 'storeProducts',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          let: { storeId: '$store' },
          pipeline: [
            {
              $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'pInfo',
              },
            },
            {
              $unwind: '$pInfo',
            },
            {
              $match: {
                $expr: {
                  $eq: ['$pInfo.store', '$$storeId'],
                },
              },
            },
          ],
          as: 'storeReviews',
        },
      },
      {
        $lookup: {
          from: 'liked_products',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user', userId] }, { $eq: ['$product', '$$productId'] }, { $eq: ['$isLiked', true] }],
                },
              },
            },
          ],
          as: 'userLikedProduct',
        },
      },
      {
        $lookup: {
          from: 'brands',
          let: { brandId: '$infos.brand' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$brandId'] },
              },
            },
          ],
          as: 'brandInfo',
        },
      },
      {
        $lookup: {
          from: 'models',
          let: { modelId: '$infos.model' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$modelId'] },
              },
            },
          ],
          as: 'modelInfo',
        },
      },
      {
        $lookup: {
          from: 'flags', // Adjust this to match your flags collection name
          localField: 'infos.flags',
          foreignField: '_id',
          as: 'flagsInfo',
        },
      },
      {
        $addFields: {
          avgStars: { $avg: '$reviews.stars' },
          countOfReview: { $size: '$reviews' },
          store: { $arrayElemAt: ['$storeInfo', 0] },
          brand: { $arrayElemAt: ['$brandInfo', 0] },
          model: { $arrayElemAt: ['$modelInfo', 0] },
          storeProductCount: { $size: '$storeProducts' },
          storeAvgStars: { $avg: '$storeReviews.stars' },
          isFavorite: { $gt: [{ $size: '$userLikedProduct' }, 0] },
        },
      },
    ];

    const result = await ProductsModel.aggregate(aggregatePipeline);

    if (!result || result.length === 0) {
      throw new NotFoundError('Product');
    }

    const productData = result[0];

    return new ProductItemResponse(productData, lang);
  }

  
}
