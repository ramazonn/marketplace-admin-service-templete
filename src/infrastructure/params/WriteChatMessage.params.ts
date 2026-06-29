import * as Joi from 'joi';
import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { DeliveryAddressTypeEnum, MessageTypeEnum, PaymentTypeEnum, SenderTypeEnum } from '@ubaytools/core';

@swaggerClass()
export class WriteChatMessageParams {
  @swaggerProperty({ type: 'string', required: true }) chatId: string;
  @swaggerProperty({ type: 'string', required: true }) message: string;
  @swaggerProperty({ type: 'string', required: true, description: Object.values(MessageTypeEnum).join('|') }) messageType: string;

  constructor(params: any) {
    if (params) {
      this.chatId = params?.chatId;
      this.message = params?.message;
      this.messageType = params?.messageType;
    }
  }

  async validate() {
    return await WriteChatMessageParamsSchema.validateAsync(this);
  }
}

export const WriteChatMessageParamsSchema = Joi.object<WriteChatMessageParams>({
  chatId: Joi.string().trim().required(),
  message: Joi.string().trim().required(),
  messageType: Joi.string().trim().required(),
});
