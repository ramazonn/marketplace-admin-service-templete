import * as Joi from 'joi';
import { swaggerProperty } from 'koa-swagger-decorator';
import { DeliveryAddressTypeEnum, OrderStatusEnum, PaymentTypeEnum } from '@ubaytools/core';
import { min } from 'moment';

@swaggerProperty()
export class UpdateOrderParams {

  @swaggerProperty({ type: 'string', required: false, description: 'Manager id' }) manager: string;
  @swaggerProperty({ type: 'string', required: false, description: 'Comment' }) comment: string;
  @swaggerProperty({ type: 'object', required: false }) address: object;
  @swaggerProperty({ type: 'string', required:false , description: Object.values(DeliveryAddressTypeEnum).join('|') }) deliveryAddressType: DeliveryAddressTypeEnum;
  @swaggerProperty({
    type: 'array', required: false, items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        quantity: { type: 'number' },
        discount_percent: { type: 'number' },
        discount_amount: { type: 'number' },
        price: { type: 'number' }
      }
    }
  }) products: Array<{
    id: string;
    quantity: number;
    price: number;
    discount_percent: number;
    discount_amount:number
  }>;
  @swaggerProperty({ type: 'number', required: false }) totalAmount: number;
  @swaggerProperty({ type: 'number', required: false }) deliveryPrice: number;
  @swaggerProperty({ type: 'string',required:false ,description: Object.values(PaymentTypeEnum).join('|') }) paymentType: PaymentTypeEnum;
  @swaggerProperty({
    type: 'string',
    required: false,
    description: Object.values(OrderStatusEnum).join('|')
  })
  status: string;
  @swaggerProperty({ type: 'boolean', required: false }) urgentDelivery: boolean;


  constructor(params: any) {
  
  if (params) {
    this.manager = params?.manager;
    this.comment = params?.comment;
    this.address = params?.address;
    this.deliveryAddressType = params?.deliveryAddressType;
    this.products = params?.products;
    this.totalAmount = params?.totalAmount;
    this.deliveryPrice = params?.deliveryPrice;
    this.paymentType = params?.paymentType;
    this.status = params?.status;
    this.urgentDelivery = params?.urgentDelivery
  }
  }

  async validate() {
    return await UpdateOrderParamsSchema.validateAsync(this);
  }
}

export const UpdateOrderParamsSchema = Joi.object<UpdateOrderParams>({
  manager: Joi.string().optional(),
  comment: Joi.string().optional(),
  status: Joi.object().optional().allow(...Object.values(OrderStatusEnum)),
  paymentType: Joi.object().optional().allow(...Object.values(PaymentTypeEnum)) ,
  deliveryAddressType: Joi.object().optional().allow(...Object.values(DeliveryAddressTypeEnum)),
  address: Joi.object().optional(),
  products: Joi.array().
    items(Joi.object({
      id: Joi.string().required(),
      quantity: Joi.number().required(),
      price: Joi.number().required(),
      discount_percent: Joi.number().required().min(0).max(100),
      discount_amount: Joi.number().required().
        when('discount_percent', {
        is: Joi.number().greater(0),
        then: Joi.number().greater(0).required(),
        otherwise: Joi.number().min(0).required()
      })
    })).optional(),
  totalAmount: Joi.number().when("products", {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  deliveryPrice: Joi.number().optional(),
  urgentDelivery:Joi.boolean().optional()
});
