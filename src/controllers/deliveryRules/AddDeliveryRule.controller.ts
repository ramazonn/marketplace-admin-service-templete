import { Context } from 'koa';
import { AddDeliveryRuleParams } from '../../infrastructure';
import { BaseError, Repository, DeliveryRulesEntity, ActionTypeEnum, ActionLogFailureReasonEnum } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/delivery-rules')
export default class AddDeliveryRuleController {
  @request('post', '/add')
  @summary('DeliveryRule add')
  @security([])
  @tags(['DeliveryRules'])
  @body((AddDeliveryRuleParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: AddDeliveryRuleParams;
    try {
      params = await new AddDeliveryRuleParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const lastRule = (
        await Repository.DeliveryRules().list(
          { page: 1, size: 1 },
          {},
          { priority: -1 },
        )
      )[0];

      if (lastRule) {
        const lastMaxAmount = lastRule.getMaxAmount();
        if (lastMaxAmount === null || lastMaxAmount === undefined) {
          throw new BaseError(
            'Creating not allowed. Please first update the last rule\'s maxAmount, then retry adding the new rule.',
            {
              en: 'Creating not allowed. Please first update the last rule\'s maxAmount, then retry adding the new rule.',
              ru: 'Создание запрещено. Сначала обновите maxAmount последнего правила, затем повторите добавление.',
              uz: 'Yaratish taqiqlangan. Avval oxirgi qoidaning maxAmount qiymatini yangilang, keyin qayta urinib ko\'ring.',
            },
            400,
          );
        }
        if (params.minAmount !== lastMaxAmount) {
          throw new BaseError(
            `New rule's minAmount must equal the last rule's maxAmount (${lastMaxAmount})`,
            {
              en: `New rule's minAmount must equal the last rule's maxAmount (${lastMaxAmount})`,
              ru: `minAmount новой позиции должен быть равен maxAmount последней (${lastMaxAmount})`,
              uz: `Yangi qoidaning minAmount oxirgi qoidaning maxAmount (${lastMaxAmount}) ga teng bo'lishi kerak`,
            },
            400,
          );
        }
      }

      const newPriority = lastRule ? (lastRule.getPriority() ?? 0) + 1 : 1;

      const rule = new DeliveryRulesEntity()
        .buildMinAmount(params.minAmount)
        .buildMaxAmount(params.maxAmount ?? null)
        .buildDeliveryPrice(params.deliveryPrice)
        .buildNote(params.note ?? null)
        .buildPriority(newPriority);

      const created = await Repository.DeliveryRules().create(rule);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'DeliveryRule',
        resourceId: created.getId(),
        after: created.convertToSchema() as unknown as Record<string, unknown>
      });

      return context.send.data({ id: created.getId().toString() });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.CREATE,
        resource: 'DeliveryRule',
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
