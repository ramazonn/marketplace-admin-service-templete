import { Context } from 'koa';
import { IdParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { string } from 'joi';

@prefix('/manager')
export default class GetManagerDetailController {
  @request('get', '/detail/{managerId}')
  @summary('Manager detail by id')
  @security([])
  @tags(['Manager'])
  @path({ managerId: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    let params: IdParams;
    try {
      params = await new IdParams({ id: context.params.managerId }).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const manager = await Repository.Managers().getById(new Types.ObjectId(params.id));
      if (!manager) {
        throw new NotFoundError('Manager');
      }

      return context.send.data({ id: manager.getId().toString(), name: manager.getName(), sapId: manager.getSapId() ?? null });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
