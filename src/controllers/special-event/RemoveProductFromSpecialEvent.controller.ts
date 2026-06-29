import { Context } from 'koa';
import { IdParams, RemoveProductsFromSpecialEventParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { InvalidateRedisCache } from '../../utils/InvalidateRedisCashe';
import { ActionLogService } from '../../services';

@prefix('/special-event')
export default class RemoveProductFromSpecialEventController {
  @request('post', '/remove-product/{specialEventId}')
  @summary('Remove Product from Special Event')
  @security([])
  @tags(['Special Event'])
  @path({ specialEventId: { type: 'string', required: true } })
  @body((RemoveProductsFromSpecialEventParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: RemoveProductsFromSpecialEventParams;
    let idParams: IdParams;
    try {
      idParams = await new IdParams({ id: context.params.specialEventId }).validate();  
      params = await new RemoveProductsFromSpecialEventParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    
    try {
      const specialEvent = await Repository.SpecialEvents().getById(new Types.ObjectId(idParams.id));
      
      if (!specialEvent) {
        throw new NotFoundError('Special Event');
      }
      let before = {}
      for(const productId of params.products){
        const spcialEventProduct = await Repository.SpecialEventProducts().findByProductAndSpecialEvent(new Types.ObjectId(productId), new Types.ObjectId(idParams.id));
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:basic:${productId.toString()}:`);  
        await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:product:detail:${productId.toString()}:`);
        if (!spcialEventProduct) {
          throw new NotFoundError('Product'); 
        }
        before = await Repository.SpecialEventProducts().findOneRaw(spcialEventProduct.getId())
        Repository.SpecialEventProducts().deleteById(spcialEventProduct.getId());
        await ActionLogService.logSuccess({
                context,
                action: ActionTypeEnum.DELETE,
                resource: 'special-event-product',
                resourceId: spcialEventProduct.getId(),
                before,
              });
      }

      await InvalidateRedisCache.execute('special-event:list:');  
      await InvalidateRedisCache.execute('special-event:count'); 
      await InvalidateRedisCache.execute('carousel:list:');  
      await InvalidateRedisCache.execute('carousel:count'); 


      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:${idParams.id}:`);
      await InvalidateRedisCache.execute(`${process.env.NODE_ENV}:special-event:product:${idParams.id}:`);

      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'special-event-product',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
} 