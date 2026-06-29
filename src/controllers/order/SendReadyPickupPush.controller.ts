import { Context } from 'koa';
import { path, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { BaseError, ErrorCodeEnum, NotFoundError, OrderStatusEnum, Repository } from '@ubaytools/core';
import { NotificationTemplateService } from '../../services/firebase-notification/NotificationTemplateService';
import { NotificationQueueService } from '../../services';

@prefix('/orders')
export default class SendReadyPickupPushController {
  @request('post', '/{orderId}/send-ready-pickup-push')
  @summary('Send READY_TO_PICK_UP notification to client')
  @security([])
  @tags(['Orders'])
  @path({ orderId: { type: 'string', required: true } })
  static async controller(ctx: Context) {
    const orderId = ctx.params.orderId;
    try {
      const order = await Repository.Orders().getById(new Types.ObjectId(orderId));
      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.getStatus() !== OrderStatusEnum.READY_TO_PICKUP) {
        throw new BaseError(
          'Order is not in READY_TO_PICKUP status',
          {
            en: 'Order is not in READY_TO_PICKUP status',
            ru: 'Заказ не в статусе ГОТОВ К САМОВЫВОЗУ',
            uz: 'Buyurtma READY_TO_PICKUP holatida emas',
          },
          ErrorCodeEnum.BAD_REQUEST,
        );
      }

      const user = await Repository.Users().findOneRaw({_id: order.getUser()})
      const lang= user.language;

      const maxDays = Number(process.env.ORDER_PICKUP_EXPIRE_DAYS || 7);

      const shippedAt = new Date(order.getShippedAt());
      const now = new Date();

      const diffDays = Math.floor((now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60 * 24));

      const daysLeft = maxDays - diffDays;

      if (daysLeft <= 0) {
        return ctx.send.data({
          push: {
            attempted: false,
            sent: false,
          },
        });
      }
      const addr = order.getShippingAddress() as any;

      const address = [addr?.address].filter(Boolean).join(', ');

      const messages = {
        uz: `${order.getOrderCode()} raqamli buyurtmangiz sizni ${address} topshirish punktida kutyapti. Agar ${daysLeft} kunda olib ketmasangiz, buyurtmangiz qaytib ketadi.`,
        ru: `Ваш заказ №${order.getOrderCode()} ожидает вас в пункте выдачи: ${address}. Если вы не заберёте его в течение ${daysLeft} дней, заказ будет возвращён.`,
        en: `Your order #${order.getOrderCode()} is waiting for you at the pickup point: ${address}. If you do not pick it up within ${daysLeft} days, it will be returned.`,
      };

      const titles = {
        uz: 'Buyurtmangizni olib ketishni unutmang!',
        ru: 'Не забудьте забрать свой заказ!',
        en: 'Don’t forget to pick up your order!',
      };


      const queue = NotificationQueueService.getInstance();

      await queue.sendPush({
        userId: order.getUser() as any,
        title: titles[lang] ?? titles.uz,
        body: messages[lang] ?? messages.uz,
        data: {
          orderId: order.getId().toString(),
          deepLink: `orders/${order.getId()}`,
        },
      });

      return ctx.send.data({
        push: {
          attempted: true,
          sent: true,
          queued: true,
        },
      });
    } catch (error) {
      console.log(error);
      return ctx.send.error(error);
    }
  }
}
