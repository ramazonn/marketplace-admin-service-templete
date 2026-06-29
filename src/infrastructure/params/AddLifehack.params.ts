import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddLifehackParams {
  @swaggerProperty({ type: 'string', required: true }) videoLink: string;
  @swaggerProperty({ type: 'string', required: false })
  product?: string;

  constructor(params: any) {
   
    this.videoLink = params?.videoLink;
    this.product = params?.product;
  }

  async validate() {
    return await AddLifehackParamsSchema.validateAsync(this);
  }
}

export const AddLifehackParamsSchema = Joi.object<AddLifehackParams>({  
  videoLink: Joi.string().uri().trim().optional(),
  product: Joi.string().optional(),
});
