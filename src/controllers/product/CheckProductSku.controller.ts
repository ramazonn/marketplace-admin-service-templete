import { Context } from 'koa';
import { AddProductParams } from '../../infrastructure';
import { BadRequestError, ProductEntity, ProductInfoEntity, ProductStatusEnum, Repository } from '@ubaytools/core';
import { Types } from 'mongoose';
import { body, path, prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';

@prefix('/product')
export default class CheckProductSkuController {
  @request('post', '/check-sku')
  @summary('Chekc Product Sku')
  @security([])
  @tags(['Product'])
  @query({ sku: { type: 'string', required: true } })
  static async controller(context: Context): Promise<void> {
    const { sku } = context.query as any;
    try {
      const product = await Repository.Products().getBySku(sku);
      let isExist = product && product.getStatus() !==  ProductStatusEnum.DELETED? true : false;      
      
      return context.send.data({ isExist });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
