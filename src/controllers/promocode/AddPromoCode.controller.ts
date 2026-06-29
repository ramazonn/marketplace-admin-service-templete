import { Context } from 'koa';
import { AddPromoCodeParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, PromoCodeEntity, Repository, PromoCodeOwnerTypeEnum} from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';
import { Types } from 'mongoose';

@prefix('/promocode')
export default class AddPromoCodeController {
  @request('post', '/add')
  @summary('Promocode add')
  @security([])
  @tags(['Promocode'])
  @body((AddPromoCodeParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddPromoCodeParams;
    try {
      params = await new AddPromoCodeParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const existing = await Repository.PromoCodes().list({ page: 1, size: 1 }, { code: params.code.toUpperCase() });
      if (existing?.length) {
        return context.send.error(new Error('Promocode already exists'));
      }

      const promoCode = new PromoCodeEntity()
        .buildCode(params.code)
        .buildDescription(params.description)
        .buildType(params.type)
        .buildValue(params.value)
        .buildIsActive(params.isActive ?? true)

      if (params.store) {
        promoCode.buildStore(new Types.ObjectId(params.store)).buildOwnerType(PromoCodeOwnerTypeEnum.STORE);
      } else {
        promoCode.buildOwnerType(PromoCodeOwnerTypeEnum.MARKETPLACE);
      }
      if (params.startDate) {
        promoCode
          .buildStartDate(new Date(params.startDate));
      }
      if (params.endDate) {
        promoCode
          .buildEndDate(new Date(params.endDate));
      }

      if (params.usageLimit !== undefined) promoCode.buildUsageLimit(params.usageLimit as any);
      if (params.perUserLimit !== undefined) promoCode.buildPerUserLimit(params.perUserLimit as any);

      const created = await Repository.PromoCodes().create(promoCode);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Promocode',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Promocode',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}


