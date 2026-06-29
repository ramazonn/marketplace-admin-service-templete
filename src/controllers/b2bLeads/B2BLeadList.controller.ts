import { Context } from 'koa';
import { B2BLeadListParams } from '../../infrastructure';
import { B2BLeadEntity, Repository, B2BLeadStatusEnum } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

class B2BLeadResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  companyName: string;
  additionalInfo: string;
  comment: string;
  status: B2BLeadStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(b2bLead: B2BLeadEntity) {
    this.id = b2bLead.getId().toString();
    this.fullName = b2bLead.getFullName();
    this.phoneNumber = b2bLead.getPhoneNumber();
    this.companyName = b2bLead.getCompanyName();
    this.additionalInfo = b2bLead.getAdditionalInfo();
    this.comment = b2bLead.getComment();
    this.status = b2bLead.getStatus();
    this.createdAt = b2bLead.getCreatedAt();
    this.updatedAt = b2bLead.getUpdatedAt();
  }
}

@prefix('/b2b-leads')
export default class B2BLeadListController {
  @request('get', '/list')
  @summary('B2BLead list')
  @security([])
  @tags(['B2BLeads'])
  @query((B2BLeadListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: B2BLeadListParams;
    try {
      params = await new B2BLeadListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const count = await Repository.B2BLeads().countDocumentsByFilter({});
      const filter :any= {}
      if (params.status) {
        filter.status = params.status
      }
      const b2bLeads = await Repository.B2BLeads().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      const result = b2bLeads.map((b2bLead) => new B2BLeadResponse(b2bLead));
      return context.send.data({ total: count, items: result });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
