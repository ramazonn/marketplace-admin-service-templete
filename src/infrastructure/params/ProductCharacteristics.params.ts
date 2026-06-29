import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class ProductCharacteristicsParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search: string;
  @swaggerProperty({ type: 'array', items: { type: 'string' }, required: false }) currentIds: string[];

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
      this.currentIds = params?.currentIds;
    }
  }

  async validate() {
    return await ProductCharacteristicsParamsSchema.validateAsync(this);
  }
}

export const ProductCharacteristicsParamsSchema = Joi.object<ProductCharacteristicsParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().trim().optional(),
  currentIds: Joi.array().items(Joi.string()).optional(),
}); 