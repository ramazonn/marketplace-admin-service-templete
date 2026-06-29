import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddCharacteristicToCategoryParams {
  @swaggerProperty({
    type: 'array',
    required: true,
    description: 'Array of category IDs',
    items: { type: 'string' },
  })
  categoryIds: Array<string>;

  constructor(params: any) {
    this.categoryIds = params?.categoryIds;
  }

  async validate() {
    return await AddCharacteristicToCategoryParamsSchema.validateAsync(this);
  }
}

export const AddCharacteristicToCategoryParamsSchema = Joi.object<AddCharacteristicToCategoryParams>({
  categoryIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)) // validates MongoDB ObjectId format
    .min(1) // must contain at least one category
    .required(),
});

