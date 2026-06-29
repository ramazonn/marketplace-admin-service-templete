import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';

@swaggerClass()
export class AnswerReviewParams {
  @swaggerProperty({ type: 'string', required: true }) answer: string;

  constructor(params: any) {
    if (params) {
      this.answer = params?.answer;
    }
  }

  async validate() {
    return await AnswerReviewParamsSchema.validateAsync(this);
  }
}

export const AnswerReviewParamsSchema = Joi.object<AnswerReviewParams>({
  answer: Joi.string().trim().required(),
});
