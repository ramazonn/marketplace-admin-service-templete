import { Context } from 'koa';
import { IdParams, UpdateBonussesParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BadRequestError, BaseError, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/bonusses')
export default class UpdateBonussesController {
  @request('put', '/{bonussesId}')
  @summary('Bonusses update')
  @security([])
  @tags(['Bonusses'])
  @path({ bonussesId: { type: 'string', required: true } })
  @body((UpdateBonussesParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateBonussesParams;
    try {
      idParams = await new IdParams({ id: context.params.bonussesId }).validate();
      params = await new UpdateBonussesParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const bonus = await Repository.Bonusses().getById(new Types.ObjectId(idParams.id));
      if (!bonus) {
        throw new NotFoundError('Bonusses');
      }

      // Resolve new (type, store, isActive) values after potential changes
      const newType = params.type ?? bonus.getType();
      const newStoreId =
        params.store !== undefined && params.store !== null
          ? new Types.ObjectId(params.store)
          : bonus.getStore();
      // Note: getIsActive method needs to be added to BonussesEntity in @ubaytools/core
      const newIsActive = params.isActive !== undefined ? params.isActive : bonus.getIsActive();

      // Ensure each store has only one active bonus per type (excluding current bonus)
      // Only check if the bonus will be active after update
      if (newIsActive) {
        const existCount = await Repository.Bonusses().countDocumentsByFilter({
          _id: { $ne: bonus.getId() },
          type: newType,
          store: newStoreId,
          isActive: true,
        });

        if (existCount > 0) {
          throw new BaseError('Active bonus with this type already exist', {
            en: `Active bonus with this type already exist`,
            ru: `Активный бонус с этим типом уже существует`,
            uz: `Bu turdagi aktiv bonus mavjud`,
          });
        }
      }

      if (params.type) bonus.buildType(params.type);
      if (params.store) bonus.buildStore(new Types.ObjectId(params.store));
      if (params.amount !== undefined) bonus.buildAmount(params.amount);
      // Note: buildIsActive method needs to be added to BonussesEntity in @ubaytools/core
      if (params.isActive !== undefined) {
        bonus.buildIsActive(params.isActive);
      }

      await Repository.Bonusses().update(bonus);
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Bonusses',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
