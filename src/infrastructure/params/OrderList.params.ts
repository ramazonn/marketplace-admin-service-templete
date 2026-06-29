import * as Joi from 'joi';
import { swaggerProperty } from 'koa-swagger-decorator';
import { OrderStatusEnum, PaymentTypeEnum } from '@ubaytools/core';

@swaggerProperty()
export class OrderListParams {
  @swaggerProperty({
    type: 'object',
    properties: {
      customer: { type: 'string', required: false },
      status: { type: 'string', required: false, description: Object.values(OrderStatusEnum).join(' | '), example: OrderStatusEnum.PENDING },
      minPrice: { type: 'number', required: false },
      maxPrice: { type: 'number', required: false },
      startDate: { type: 'date', required: false },
      endDate: { type: 'date', required: false },
       paymentType: { type: 'string', required: false, description: Object.values(PaymentTypeEnum).join(' | '), example: PaymentTypeEnum.CASH },
       paymentConfirmed: { type: 'boolean', required: false, default: false },
    },
  })
  filter: any;

  @swaggerProperty({
    type: 'string',
    required: false,
  })
  search: string;
  @swaggerProperty({ type: 'string', required: false, })
  store?: string;

  constructor(params: any) {
    if (params) {
      this.filter = params?.filter;
      this.search = params?.search;
      this.store = params?.store;
    }
  }

  async validate() {
    return await OrderListParamsSchema.validateAsync(this);
  }
}

export const OrderListParamsSchema = Joi.object<OrderListParams>({
  filter: Joi.object().optional(),
  search: Joi.string().optional(),
  store: Joi.string().optional(),
});
