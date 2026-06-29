import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AddLifehackCommentReplyParams {
  @swaggerProperty({
    type: 'string',
    required: true,
    example: '65f1234567890abcdef12345',
  })
  comment: string;

  @swaggerProperty({
    type: 'string',
    required: true,
    example: 'Rahmat, fikringiz uchun!',
  })
  text: string;

  constructor(params: any) {
    this.comment = params?.comment;
    this.text = params?.text;
  }

  async validate(): Promise<AddLifehackCommentReplyParams> {
    return await AddLifehackCommentReplyParamsSchema.validateAsync(this);
  }
}

export const AddLifehackCommentReplyParamsSchema =
  Joi.object<AddLifehackCommentReplyParams>({
    comment: Joi.string().required(),
    text: Joi.string().trim().required(),
  });