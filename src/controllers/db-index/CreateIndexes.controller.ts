import { prefix, request, security, summary, tags } from 'koa-swagger-decorator';
import { Context } from 'koa';
import {
  CategoriesModel,
  UserCashbackModel,
  UserAddressModel,
  ReviewsModel,
  CharacteristicsModel,
  UserModel,
  FaqsModel,
  OrderModel,
  StoresModel,
  BonussesModel,
  RolesModel,
  ActionLogModel,
  AdminsModel,
  ChatsModel,
  CompareModel,
  LifehacksModel,
  MessageModel,
  StoreOrderModel,
  ProcessHistoryModel,
  ProcessSettingsModel,
  ProductsModel,
  ProductsAwaitingUserReviewsModel,
  SpecialEventModel,
  SessionModel,
  SpecialEventProductModel,
  DeviceModel,
  UserActivityEventsModel,
  UserActivityStateModel,
  UserCashbackLogModel,
  UserLikedProductModel,
  UserSegmentsModel,
} from '@ubaytools/core';

@prefix('/indexes')
export default class CreateIndexesController {
  @request('post', '/create')
  @summary('Create MongoDB indexes manually')
  @security([])
  @tags(['Indexes'])
  static async controller(context: Context): Promise<void> {
    try {
      const models = [
        { name: 'ActionLog', model: ActionLogModel },
        { name: 'Admins', model: AdminsModel },
        { name: 'Bonus', model: BonussesModel },
        { name: 'Categories', model: CategoriesModel },
        { name: 'Characteristics', model: CharacteristicsModel },
        { name: 'Chat', model: ChatsModel },
        { name: 'Compare', model: CompareModel },
        { name: 'Faq', model: FaqsModel },
        { name: 'Lifehack', model: LifehacksModel },
        { name: 'Message', model: MessageModel },
        { name: 'Order', model: OrderModel },
        { name: 'StoreOrder', model: StoreOrderModel },
        { name: 'ProcessHistory', model: ProcessHistoryModel },
        { name: 'ProcessSetting', model: ProcessSettingsModel },
        { name: 'Product', model: ProductsModel },
        { name: 'Product', model: ProductsAwaitingUserReviewsModel },
        { name: 'Roles', model: RolesModel },
        { name: 'Reviews', model: ReviewsModel },
        { name: 'Session', model: SessionModel },
        { name: 'SpecialEvent', model: SpecialEventModel },
        { name: 'SpecialEventProduct', model: SpecialEventProductModel },
        { name: 'Store', model: StoresModel },
        { name: 'Store', model: StoresModel },
        { name: 'Device', model: DeviceModel },
        { name: 'Users', model: UserModel },
        { name: 'UserActivityEvent', model: UserActivityEventsModel },
        { name: 'UserActivityState', model: UserActivityStateModel },
        { name: 'UserAddress', model: UserAddressModel },
        { name: 'UserCashback', model: UserCashbackModel },
        { name: 'UserCashbackLog', model: UserCashbackLogModel },
        { name: 'UserLikedProduct', model: UserLikedProductModel },
        { name: 'UserSegment', model: UserSegmentsModel },
      ];

      const result: {
        model: string;
        success: boolean;
        result?: unknown;
        error?: string;
      }[] = [];

      for (const item of models) {
        try {
          const createdIndexes = await item.model.createIndexes();

          result.push({
            model: item.name,
            success: true,
            result: createdIndexes,
          });
        } catch (error: any) {
          result.push({
            model: item.name,
            success: false,
            error: error?.message || 'Unknown error',
          });
        }
      }

      return context.send.data({
        result,
      });
    } catch (error) {
      return context.send.error(error);
    }
  }
}