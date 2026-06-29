import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddPartnerBrandsParams {
  @swaggerProperty({ type: 'string', required: true }) name: string;
  @swaggerProperty({ type: 'string', required: false }) logo: string;

  constructor(params: any) {
    this.name = params?.name;
    this.logo = params?.logo;
  }

  async validate() {
    return await AddPartnerBrandsParamsSchema.validateAsync(this);
  }
}

export const AddPartnerBrandsParamsSchema = Joi.object<AddPartnerBrandsParams>({
  name: Joi.string().trim().required(),
  logo: Joi.string().trim().required(),
});

