import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdateLifehackParams {
  @swaggerProperty({ type: 'string',required:true }) videoLink: string;
  @swaggerProperty({ type: 'string', required: false })
  product?: string;

  constructor(params: any) {
    this.videoLink = params?.videoLink;
     this.product = params?.product;
  }

  async validate() {
    return await UpdateLifehackParamsSchema.validateAsync(this);
  }
}

export const UpdateLifehackParamsSchema = Joi.object<UpdateLifehackParams>({  
  videoLink: Joi.string().uri().trim().optional(),
  product: Joi.string().optional(),
});
