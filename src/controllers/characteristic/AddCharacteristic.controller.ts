import { Context } from 'koa';
import { AddCharacteristicParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, CharacteristicsEntity, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/characteristic')
export default class AddCharacteristicController {
  @request('post', '/add')
  @summary('Characteristic add')
  @security([])
  @tags(['Characteristic'])
  @body((AddCharacteristicParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddCharacteristicParams;
    try {
      params = await new AddCharacteristicParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const characteristic = new CharacteristicsEntity()
        .buildKey(params.key)
        .buildValues(params.values)
        .buildStatus(params.status)
        .buildIsPin(params.isPin);
      const created = await Repository.Characteristics().create(characteristic);


      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Characteristic',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });
      const response = created.convertToSchema();
      response['id'] = created.getId().toString();
      delete response._id;
      return context.send.data(response);
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Characteristic',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
