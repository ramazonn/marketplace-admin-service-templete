import { Context } from 'koa';
import { IdParams, StoreListParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, AuthorizationError, NotFoundError, Repository, StoreStatusEnum } from '@ubaytools/core';
import { Types } from 'mongoose';
import { params, path, prefix, query, request, security, summary, swaggerClass, tags } from 'koa-swagger-decorator';
import { string } from 'joi';
import { ActionLogService } from '../../services';

@prefix('/store')
export default class DeleteStoreController {
  @request('delete', '/{storeId}')
  @summary('Store delete')
  @security([])
  @tags(['Store'])
  @path({ storeId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.storeId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const sellerId = context.auth?.seller;

      const store = await Repository.Stores().getById(new Types.ObjectId(params.id));
      if (!store) {
        throw new NotFoundError('Store');
      }

      // SELLER CHECK
      if (sellerId) {
        const storeSellerId = store.convertToSchema()?.seller?._id?.toString();

        if (storeSellerId !== sellerId) {
          throw new AuthorizationError('Forbidden');
        }
      }

      const before = await Repository.Stores().findOneRaw(new Types.ObjectId(params.id));

      store.buildStatus(StoreStatusEnum.DELETED);
      const after = await Repository.Stores().update(store);

      const beforeUserCashback = await Repository.UserCashback().findOneRaw(store.getId());

      await Repository.UserCashback().deleteByStore(store.getId());

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'StoreUserCashback',
        resourceId: store.getId(),
        before: beforeUserCashback,
      });

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Store',
        resourceId: after.getId(),
        before: before as unknown as Record<string, unknown>,
        after: after.convertToSchema() as unknown as Record<string, unknown>,
      });

      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Store',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
