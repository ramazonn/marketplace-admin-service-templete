import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { B2BLeadEntity, NotFoundError, Repository } from '@ubaytools/core';
import { Context } from 'koa';
import { IdParams } from '../../infrastructure';

class B2BLeadDetailResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  companyName: string;
  additionalInfo: string;
  comment: string;
  status: string;
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
export default class B2BLeadDetailController {
  @request('get', '/detail/{b2bLeadId}')
  @summary('B2BLead detail')
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
      const foundB2BLead = await Repository.B2BLeads().getById(new Types.ObjectId(params.id));
      if (!foundB2BLead) {
        throw new NotFoundError('B2BLead');
      }
      const response = new B2BLeadDetailResponse(foundB2BLead);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
