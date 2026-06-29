import { Types } from 'mongoose';
import { LanguageEnum, Repository, OrderItemEntity, StoresEntity } from '@ubaytools/core';
import { OrderItemResponse } from './OrderItem.response';

export class GetOrderItemDetailUseCase {
  static async execute(orderItem: OrderItemEntity, lang: LanguageEnum): Promise<OrderItemResponse> {
    const product = await Repository.Products().getById(new Types.ObjectId(orderItem.getProductId()));

    return new OrderItemResponse(product, orderItem, product?.getStore() as StoresEntity, lang);
  }
}
