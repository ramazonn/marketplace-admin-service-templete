import { Context } from 'koa';
import { AddCharacteristicParams, IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/characteristic')
export default class UpdateCharacteristicController {
  @request('put', '/{characteristicId}')
  @summary('Characteristic update')
  @security([])
  @tags(['Characteristic'])
  @body((AddCharacteristicParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCharacteristicParams;
    let idParams: IdParams;
    try {
      params = await new AddCharacteristicParams(context.request.body).validate();
      idParams = await new IdParams({ id: context.params.characteristicId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const item = await Repository.Characteristics().getById(new Types.ObjectId(idParams.id));
      if (!item) {
        throw new NotFoundError('Characteristic');
      }
      const before = await Repository.Characteristics().findOneRaw(new Types.ObjectId(idParams.id))
      item.buildKey(params.key).buildValues(params.values).buildStatus(params.status).buildIsPin(params.isPin);
      const updated = await Repository.Characteristics().update(item);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Characteristic',
        resourceId: updated.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updated.convertToSchema() as unknown as Record<string, unknown>,
      });
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'Characteristic',
        resourceId: new Types.ObjectId(idParams.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
