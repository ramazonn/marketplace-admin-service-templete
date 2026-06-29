import { Context } from 'koa';
import { AddStoreParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository, StoresEntity, StoreStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/store')
export default class AddStoreController {
  @request('post', '/add')
  @summary('Store add')
  @security([])
  @tags(['Store'])
  @body((AddStoreParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddStoreParams;
    try {
      params = await new AddStoreParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const sellerId = context.auth?.seller;
      let finalSellerId: Types.ObjectId;

      //finalSellerId Seller accountga to'lliq otilganda faqat tokendan olamiz shu joyi to'g'rilanishi kerak
      
       if (sellerId) {
        finalSellerId = new Types.ObjectId(sellerId);
      } else {
        if (!params.seller) {
          throw new NotFoundError('Seller is required');
        }
        finalSellerId = new Types.ObjectId(params.seller);
      }

      const store = new StoresEntity()
        .buildName(params.name)
        .buildShortName(params.sku)
        .buildDescription(params.description)
        .buildSeller(finalSellerId)
        .buildStatus(StoreStatusEnum.ACTIVE)
        .buildAvatar(params.avatar)
        .buildCoverBanner(params.cover_banner)
        .buildCoverMobileBanner(params.cover_mobile_banner)
        .buildSocialLinks(params.social_links)
        .buildUsdRate(params.usd_rate ?? 0)
      if (params.cashbackConfig) {
        store.buildCashbackConfig(params?.cashbackConfig)
      }
      const created = await Repository.Stores().create(store);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Store',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {

      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Store',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
