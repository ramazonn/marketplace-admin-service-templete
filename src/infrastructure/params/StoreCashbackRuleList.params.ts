import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class StoreCashbackRuleListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: true }) storeId: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.storeId = params?.storeId;
    }
  }

  async validate() {
    return await StoreCashbackRuleListParamsSchema.validateAsync(this);
  }
}

export const StoreCashbackRuleListParamsSchema = Joi.object<StoreCashbackRuleListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  storeId: Joi.string().trim().required().pattern(new RegExp('^[0-9a-fA-F]{24}$')),
});

