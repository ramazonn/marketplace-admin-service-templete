import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { UpdateB2BLeadParams } from '../../infrastructure/params/UpdateB2BLead.params';
import { ActionLogService } from '../../services';

@prefix('/b2b-leads')
export default class UpdateB2BLeadController {
  @request('put', '/{b2bLeadId}')
  @summary('B2BLead update')
  @security([])
  @tags(['B2BLeads'])
  @path({ b2bLeadId: { type: 'string', required: true } })
  @body((UpdateB2BLeadParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let idParams: IdParams;
    let params: UpdateB2BLeadParams;
    try {
      idParams = await new IdParams({ id: context.params.b2bLeadId }).validate();
      params = await new UpdateB2BLeadParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const b2bLead = await Repository.B2BLeads().getById(new Types.ObjectId(idParams.id));
      const before = await Repository.B2BLeads().findOneRaw(new Types.ObjectId(idParams.id))
      if (!b2bLead) {
        throw new NotFoundError('B2BLead');
      }
      console.log(params);
      
      b2bLead.buildComment(params.comment);
      if (params.status) b2bLead.buildStatus(params.status);

      const updateb2bLead = await Repository.B2BLeads().update(b2bLead);

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.UPDATE,
        resource: 'B2BLead',
        resourceId: b2bLead.getId(),
        before: before as unknown as Record<string, unknown>,
        after: updateb2bLead.convertToSchema() as unknown as Record<string, unknown>,
      });
      
      return context.send.data({ updated: true });
    } catch (error) {
      await ActionLogService.logFailure({
              context,
              action: ActionTypeEnum.UPDATE,
              resource: 'B2BLead',
              resourceId: new Types.ObjectId(idParams.id),
              failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
      return context.send.error(error);
    }
  }
}
