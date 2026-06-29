import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class UpdatePartnerBrandsParams {
  @swaggerProperty({ type: 'string', required: false }) name: string;
  @swaggerProperty({ type: 'string', required: false }) logo: string;

  constructor(params: any) {
    this.name = params?.name;
    this.logo = params?.logo;
  }

  async validate() {
    return await UpdatePartnerBrandsParamsSchema.validateAsync(this);
  }
}

export const UpdatePartnerBrandsParamsSchema = Joi.object<UpdatePartnerBrandsParams>({
  name: Joi.string().trim().optional(),
  logo: Joi.string().trim().optional(),
});

