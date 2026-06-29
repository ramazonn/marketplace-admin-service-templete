import { Context } from 'koa';
import { Repository, LifehacksEntity, ActionTypeEnum, ActionLogFailureReasonEnum, NotFoundError } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { AddLifehackParams } from '../../infrastructure';
import { Types } from 'mongoose';
import { ActionLogService } from '../../services';

@prefix('/lifehacks')
export default class AddLifehackController {
  @request('post', '/add')
  @summary('Lifehack add')
  @security([])
  @tags(['Lifehacks'])
  @body((AddLifehackParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddLifehackParams;
    try {
      params = await new AddLifehackParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const lifehack = new LifehacksEntity().buildVideoLink(params.videoLink)

      if (params.product) {
        const product = await Repository.Products().getById(new Types.ObjectId(params.product));

        if (!product) {
          throw new NotFoundError('Product');
        }
          lifehack.buildProduct(new Types.ObjectId(params.product));
      }


      const createdLifehack = await Repository.Lifehacks().create(lifehack);
      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Lifehack',
        resourceId: createdLifehack.getId(),
        after: createdLifehack.convertToSchema() as unknown as Record<string, unknown>
      });
      return context.send.data({ id: createdLifehack.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'Lifehack',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
