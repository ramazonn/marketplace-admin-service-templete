import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class CategoryListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) parent: string;
  @swaggerProperty({ type: 'string', required: false }) search: string;
  @swaggerProperty({ type: 'string' }) status: string;
  @swaggerProperty({ type: 'string', required: false }) currentId: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.parent = params?.parent;
      this.search = params?.search;
      this.status = params?.status;
      this.currentId = params?.currentId;
    }
  }

  async validate() {
    return await CategoryListParamsSchema.validateAsync(this);
  }
}

export const CategoryListParamsSchema = Joi.object<CategoryListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  parent: Joi.string().trim().optional(),
  search: Joi.string().optional(),
  status: Joi.string().optional(),
  currentId: Joi.string().optional(),
});
