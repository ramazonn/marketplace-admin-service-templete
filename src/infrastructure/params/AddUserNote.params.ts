import Joi = require("joi");
import { swaggerClass, swaggerProperty } from "koa-swagger-decorator";

@swaggerClass()
export class AddUserNoteParams {
  @swaggerProperty({ type: 'string', required: true })
  user: string;

  @swaggerProperty({ type: 'string', required: true })
  text: string;

  constructor(params: any) {
    this.user = params?.user;
    this.text = params?.text;
  }

  async validate() {
    return await AddUserNoteParamsSchema.validateAsync(this);
  }
}

export const AddUserNoteParamsSchema = Joi.object<AddUserNoteParams>({
  user: Joi.string().required(),
  text: Joi.string().required(),
});