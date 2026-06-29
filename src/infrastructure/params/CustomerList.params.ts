import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import * as moment from 'moment';

@swaggerClass()
export class CustomerListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search?: number;
  @swaggerProperty({ type: 'string', required: false, description: 'Format: DD/MM/YYYY' }) createdAt?: number;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
      this.createdAt = params?.createdAt;
    }
  }

  async validate() {
    return await CustomerListParamsSchema.validateAsync(this);
  }

  getDateFilter() {
    if (!this.createdAt) {
      return {};
    }

    const startOfDay = moment(this.createdAt, 'DD/MM/YYYY').startOf('day').toDate();
    const endOfDay = moment(this.createdAt, 'DD/MM/YYYY').endOf('day').toDate();

    return {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };
  }
}

export const CustomerListParamsSchema = Joi.object<CustomerListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().optional(),
  createdAt: Joi.date().optional(),
});
