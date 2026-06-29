import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class NewsListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
    }
  }

  async validate() {
    return await NewsListParamsSchema.validateAsync(this);
  }
}

export const NewsListParamsSchema = Joi.object<NewsListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().optional(),
});
