import { Context } from 'koa';
import { SetGetCountFromEshopParams } from '../../infrastructure';
import { ProductStatusEnum, Repository, SetMinimumCountEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/product')
export default class SetGetCountFromEshopController {
  @request('post', '/set-get-count-from-eshop')
  @summary('Set minimum count for products')
  @security([])
  @tags(['Product'])
  @body((SetGetCountFromEshopParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SetGetCountFromEshopParams;
    
    try {
      params = await new SetGetCountFromEshopParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      let updateCount = 0;

      switch (params.type) {
        case SetMinimumCountEnum.ALL:
          // Update all products (not deleted) using updateMany
          const allResult = await Repository.Products().updateMany(
            { status: { $ne: ProductStatusEnum.DELETED } },
            { getCountFromEshop: params.value }
          );
          updateCount = allResult.modifiedCount || 0;
          break;

        case SetMinimumCountEnum.NOT_EXIST:
          // Update products (not deleted) that don't have minimumCount set
          const notExistResult = await Repository.Products().updateMany(
            { 
              status: { $ne: ProductStatusEnum.DELETED },
              $or: [
                { getCountFromEshop: { $exists: false } },
                { getCountFromEshop: null }
              ]
            },
            { getCountFromEshop: params.value }
          );
          updateCount = notExistResult.modifiedCount || 0;
          break;

        case SetMinimumCountEnum.CUSTOM:
          // Update specific products by IDs (not deleted)
          if (!params.productIds || params.productIds.length === 0) {
            return context.send.error(new Error('Product IDs are required for custom type'));
          }

          const objectIds = params.productIds.map(id => new Types.ObjectId(id));
          const customResult = await Repository.Products().updateMany(
            { _id: { $in: objectIds }, status: { $ne: ProductStatusEnum.DELETED } },
            { getCountFromEshop: params.value }
          );
          updateCount = customResult.modifiedCount || 0;
          break;

        default:
          return context.send.error(new Error('Invalid type specified'));
      }

      return context.send.data({ 
        updated: true, 
        type: params.type,
        getCountFromEshop: params.value,
        updatedCount: updateCount,
        message: `Successfully updated ${updateCount} products with minimum count ${params.value}`
      });

    } catch (error) {
      return context.send.error(error);
    }
  }
} 