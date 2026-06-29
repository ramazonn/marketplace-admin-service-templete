import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

export enum ReviewFilterStatus {
  ALL = 'ALL',
  NEW = 'NEW',
  ANSWERED = 'ANSWERED',
  NOT_ANSWERED = 'NOT_ANSWERED',
}

@swaggerClass()
export class ReviewListParams {
  @swaggerProperty({ type: 'number', required: true, example: 1 }) page: number;
  @swaggerProperty({ type: 'number', required: true, example: 10 }) size: number;
  @swaggerProperty({ type: 'number', required: false }) stars: number;
  @swaggerProperty({ type: 'string', required: false, description: 'store Id' }) store: string;
  @swaggerProperty({ type: 'string', required: false }) date: Date;
  @swaggerProperty({ type: 'string', example: ReviewFilterStatus.ALL, description: Object.values(ReviewFilterStatus).join('|') }) status: string;
  @swaggerProperty({ type: 'string', required: false }) customer: string;
  @swaggerProperty({ type: 'string', required: false }) product: string;
  @swaggerProperty({ type: 'string', required: false }) search: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.date = params?.date;
      this.stars = params?.stars;
      this.store = params?.store;
      this.status = params?.status;
      this.search = params?.search;
      this.customer = params?.customer;
      this.product = params?.product;
    }
  }

  async validate() {
    return await ReviewListParamsSchema.validateAsync(this);
  }
}

export const ReviewListParamsSchema = Joi.object<ReviewListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  date: Joi.date().optional(),
  stars: Joi.number().optional(),
  store: Joi.string().trim().optional(),
  status: Joi.string().optional(),
  search: Joi.string().optional(),
  customer: Joi.string().trim().optional(),
  product: Joi.string().trim().optional(),
});
