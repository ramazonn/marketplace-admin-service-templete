import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository, BonussesEntity } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';

export class BonussesDetailResponse {
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
export default class BonussesDetailController {
  @request('get', '/detail/{bonussesId}')
  @summary('Bonusses detail')
  @security([])
  @tags(['Bonusses'])
  @path({ bonussesId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.bonussesId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const bonus = await Repository.Bonusses().getById(new Types.ObjectId(params.id));
      if (!bonus) {
        throw new NotFoundError('Bonusses');
      }
      const response = new BonussesDetailResponse(bonus);
      return context.send.data(response);
    } catch (error) {
      return context.send.error(error);
    }
  }
}
