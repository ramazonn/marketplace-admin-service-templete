import { Context } from 'koa';
import { AddBonussesParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, BadRequestError, BaseError, BonussesEntity, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/bonusses')
export default class AddBonussesController {
  @request('post', '/add')
  @summary('Bonusses add')
  @security([])
  @tags(['Bonusses'])
  @body((AddBonussesParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddBonussesParams;
    try {
      params = await new AddBonussesParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }

    try {
      const storeId = new Types.ObjectId(params.store);

      // Ensure each store has only one active bonus per type
      const existCount = await Repository.Bonusses().countDocumentsByFilter({
        type: params.type,
        store: storeId,
        isActive: true,
      });

      if (existCount > 0) {
        throw new BaseError('Active bonus with this type already exist', {
          en: `Active bonus with this type already exist`,
          ru: `Активный бонус с этим типом уже существует`,
          uz: `Bu turdagi aktiv bonussiz bor`,
        });
      }

      const bonus = new BonussesEntity()
        .buildType(params.type)
        .buildStore(storeId)
        .buildAmount(params.amount);

      const created = await Repository.Bonusses().create(bonus);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'role',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Bonusses',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
