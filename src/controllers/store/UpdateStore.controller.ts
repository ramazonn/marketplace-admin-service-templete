import { Context } from 'koa';
import { IdParams, UpdateStoreParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, AuthorizationError, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags, path } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/store')
export default class UpdateStoreController {
  @request('put', '/{storeId}')
  @summary('Store update')
  @security([])
  @tags(['Store'])
  @body((UpdateStoreParams as any).swaggerDocument)
  @path({ storeId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: UpdateStoreParams;
    let idParams: IdParams;
    try {
      idParams = await new IdParams({ id: context.params.storeId }).validate();
      params = await new UpdateStoreParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const store = await Repository.Stores().getById(new Types.ObjectId(idParams.id));
      if (!store) {
        throw new NotFoundError('Store');
      }
      const sellerId = context.auth?.seller;
      
      // SELLER CHECK
      if (sellerId) {
        const storeSellerId = store.convertToSchema()?.seller?._id?.toString();
        
        console.log(storeSellerId)
        console.log(sellerId)
        if (storeSellerId !== sellerId) {
          throw new AuthorizationError('Forbidden');
        }
      }
      
      const before = await Repository.Stores().findOneRaw(new Types.ObjectId(idParams.id));
      
      if (params.name) store.buildName(params.name);
      if (params.sku) store.buildShortName(params.sku);
      if (params.description) store.buildDescription(params.description);

      //vaqtinchalikga qoyildi keyinchalik admin ham sellenrni dokonini boshqa sellergaozgartira olmaydi hozirda yakuniga yetguncha qoyildi
      if (!sellerId && params.seller) {
        store.buildSeller(new Types.ObjectId(params.seller));
      }

      if (params.status) store.buildStatus(params.status);
      if (params.avatar) store.buildAvatar(params.avatar);
      if (params.cover_banner) store.buildCoverBanner(params.cover_banner);
      if (params.cover_mobile_banner) store.buildCoverMobileBanner(params.cover_mobile_banner);
      if (params.social_links) store.buildSocialLinks(params.social_links);
      if (params.usd_rate) store.buildUsdRate(params.usd_rate);
      if (params.cashbackConfig) store.buildCashbackConfig(params.cashbackConfig)

      const after = await Repository.Stores().update(store);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Store',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Store',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
