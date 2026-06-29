import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { ActionLogFailureReasonEnum, ActionTypeEnum, NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { ActionLogService } from '../../services';

@prefix('/b2b-leads')
export default class DeleteB2BLeadController {
  @request('delete', '/{b2bLeadId}')
  @summary('B2BLead delete')
  @security([])
  @tags(['B2BLeads'])
  @path({ b2bLeadId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.b2bLeadId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {

      const b2blead = await Repository.B2BLeads().getById(new Types.ObjectId(params.id));
      if (!b2blead) {
        throw new NotFoundError('B2BLead');
      }
      const before = await Repository.B2BLeads().findOneRaw(new Types.ObjectId(params.id));;

      await Repository.B2BLeads().delete(new Types.ObjectId(params.id));

      await ActionLogService.logSuccess({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'B2BLeads',
        resourceId: b2blead.getId(),
        before
      });
      return context.send.data({ deleted: true });
    } catch (error) {
      await ActionLogService.logFailure({
        context,
        action: ActionTypeEnum.DELETE,
        resource: 'B2BLeads',
        resourceId: new Types.ObjectId(params.id),
        failureReason: ActionLogFailureReasonEnum.BUSINESS_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return context.send.error(error);
    }
  }
}
