import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class CreateChatParams {
  @swaggerProperty({ type: 'string', required: true })
  user: string;

  @swaggerProperty({ type: 'string', required: true })
  store: string;

  constructor(params: any) {
    if (params) {
      this.user = params?.user;
      this.store = params?.store;
    }
  }

  async validate() {
    return await CreateChatParamsSchema.validateAsync(this);
  }
}

export const CreateChatParamsSchema = Joi.object<CreateChatParams>({
  user: Joi.string().required(),
  store: Joi.string().required(),
});