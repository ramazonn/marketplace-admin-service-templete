import { Context } from 'koa';
import { SendNotificationParams } from '../../infrastructure';
import { NotFoundError, Repository } from '@ubaytools/core';
import { body, prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { getMessaging } from 'firebase-admin/messaging';
import { FirebaseNotification, NotificationPayload } from '../../services/firebase-notification/FirebaseNotification';

// @prefix('/notification')
// export default class SendNotificationController {
//   @request('post', '/send')
//   @summary('Send Push Notification')
//   @security([])
//   @tags(['Notification'])
//   @body((SendNotificationParams as any).swaggerDocument)
//   static async controller(context: Context): Promise<void> {
//     let params: SendNotificationParams;
//     try {
//       params = await new SendNotificationParams(context.request.body).validate();
//     } catch (error) {
//       const joiError = await context.joi.handle(error);
//       return context.send.error(joiError);
//     }
//     try {
//       const clientDevices = await Repository.Device().getAllDevicesByOwner(new Types.ObjectId(params.client));
//       if (!clientDevices || clientDevices.length == 0) {
//         throw new NotFoundError('Client devices');
//       }

//       await Promise.all(
//         clientDevices.map((device) => {
//           try {
//             const fcmToken = device.getFcmToken();
//             if (!fcmToken) return;
//             const message = {
//               data: params.data,
//               token: fcmToken,
//               notification: {
//                 title: params.title,
//                 body: params.description,
//               },
//             };
//             return getMessaging().send(message);
//           } catch (error) {
//             console.error('Error sending notification', error);
//             return null;
//           }
//         }),
//       );

//       return context.send.data({ sended: true });
//     } catch (error) {
//       return context.send.error(error);
//     }
//   }
// }

@prefix('/notification')
export default class SendNotificationController {
  @request('post', '/send')
  @summary('Send Push Notification')
  @security([])
  @tags(['Notification'])
  @body((SendNotificationParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: SendNotificationParams;
    try {
      params = await new SendNotificationParams(context.request.body).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const clientDevices = await Repository.Device().getAllDevicesByOwner(new Types.ObjectId(params.client));
      if (!clientDevices || clientDevices.length == 0) {
        throw new NotFoundError('Client devices');
      }

      const payload: NotificationPayload = {
        title: params.title,
        body: params.description,
        data: params.data
      };

      const firebaseNotification = new FirebaseNotification();
      const result = await firebaseNotification.sendNotificationToClient(params.client, payload);

      return context.send.data({ 
        sended: true,
        successCount: result.successCount,
        failureCount: result.failureCount
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
