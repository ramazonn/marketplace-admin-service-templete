import { Context } from 'koa';
import { BonussesListParams } from '../../infrastructure';
import { Repository, BonussesEntity } from '@ubaytools/core';
import { query, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';

export class BonussesListItemResponse {
  id: string;
  type: string;
  store: string;
  amount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(bonus: BonussesEntity) {
    this.id = bonus.getId().toString();
    this.type = bonus.getType();
    this.store = bonus.getStore()?.toString();
    this.amount = bonus.getAmount();
    // Note: getIsActive method needs to be added to BonussesEntity in @ubaytools/core
    this.isActive = (bonus as any).getIsActive ? (bonus as any).getIsActive() : true;
    this.createdAt = bonus.getCreatedAt();
    this.updatedAt = bonus.getUpdatedAt();
  }
}

@prefix('/bonusses')
export default class BonussesListController {
  @request('get', '/list')
  @summary('Bonusses list')
  @security([])
  @tags(['Bonusses'])
  @query((BonussesListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: BonussesListParams;
    try {
      params = await new BonussesListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const filter: any = {};
      if (params.type) filter['type'] = params.type;
      if (params.store) filter['store'] = new Types.ObjectId(params.store);

      const count = await Repository.Bonusses().countDocumentsByFilter(filter);
      const items = await Repository.Bonusses().list(
        { page: params.page, size: params.size }, 
        filter,
        { createdAt: -1 }
      );
      const response = items.map((item) => new BonussesListItemResponse(item));
      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
