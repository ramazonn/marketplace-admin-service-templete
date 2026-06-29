import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class CharacteristicListParams {
  @swaggerProperty({ type: 'number', required: true }) page: number;
  @swaggerProperty({ type: 'number', required: true }) size: number;
  @swaggerProperty({ type: 'string', required: false }) search: string;
  @swaggerProperty({ type: 'string', required: false }) currentId: string;

  constructor(params: any) {
    if (params) {
      this.page = params?.page;
      this.size = params?.size;
      this.search = params?.search;
      this.currentId = params?.currentId;
    }
  }

  async validate() {
    return await CharacteristicListParamsSchema.validateAsync(this);
  }
}

export const CharacteristicListParamsSchema = Joi.object<CharacteristicListParams>({
  page: Joi.number().min(1).required(),
  size: Joi.number().min(1).required(),
  search: Joi.string().trim().optional(),
  currentId: Joi.string().optional(),
});
