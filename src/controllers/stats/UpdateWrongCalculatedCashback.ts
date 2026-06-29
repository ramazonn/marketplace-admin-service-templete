import {  OrderModel, OrderStatusEnum, Repository, StoreCashbackTypeEnum} from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags, query, } from 'koa-swagger-decorator';
import { RequiredDateFilterParams } from '../../infrastructure';
import { GeneratePeriods } from '../../utils';
import { Types } from 'mongoose';

@prefix('/stats')
export default class UpdateWrongCalculatedCashbackController {
  @request('post', '/update-wrong-calculated-cashback')
  @summary('Statistics')
  @security([])
  @tags(['Statistics'])


  static async controller(context: Context): Promise<void> {
    try {      
      let userCashbackLogs = await Repository.UserCashbackLog().list({}, { cashbackType: StoreCashbackTypeEnum.BASED_ON_ORDER_AMOUNT })
      console.log("-+", userCashbackLogs.length);
      let index = 0
      for (let cashbackLog of userCashbackLogs) {
        index++
        // console.log(cashbackLog,cashbackLog.getStoreOrder());
        
        const userId = cashbackLog.getUser() as Types.ObjectId
        const storeOrder = await Repository.StoreOrders().getById(cashbackLog.getStoreOrder() as Types.ObjectId);
        if(!storeOrder)continue
        
        const storeId = storeOrder.getStoreId()
        const store = await Repository.Stores().getById(storeId)
        let cashbackAmount = storeOrder.getCashbackEarned()
        let cashbackPercent = storeOrder.getCashbackPercent()
        const cashbackConfig = store.getCashbackConfig()
        let amountToCalculateCashback = 0
        const wrongCashback = cashbackAmount;
        
          /**Calculate cashback amount based on order amount: if store cashback type is based on order amount*/
        if (storeOrder.getCashbackType() == StoreCashbackTypeEnum.BASED_ON_ORDER_AMOUNT) {
          // identify how much amount available to calculate cashback
          const items = storeOrder.getItems()
          items.forEach((item) => {
            // it gets zero(0) if cashbackConfig's includeDiscounted field is false and item purchased with discount 
            const itemPrice = cashbackConfig.getIncludeDiscounted() ? item.getFinalPrice() : item.getHasDiscount() ? 0 : item.getPrice();
            amountToCalculateCashback += itemPrice * item.getQuantity()
          })
          const storeCashbackRule = await Repository.StoreCashbackRules().findSuitableRule(storeId, amountToCalculateCashback)

          if (storeCashbackRule) {
            cashbackPercent = amountToCalculateCashback > storeCashbackRule.getAmount() ? storeCashbackRule.getUpperPercent() : storeCashbackRule.getLowerPercent()
            cashbackAmount = (amountToCalculateCashback * cashbackPercent) / 100
          } else {
            cashbackAmount = 0
            cashbackPercent = 0
          }
             
          storeOrder.buildIsCashbackAdded(true) // mark as cashback added
          storeOrder.buildCashbackEarned(cashbackAmount);
          storeOrder.buildCashbackPercent(cashbackPercent);
          await Repository.StoreOrders().update(storeOrder);
        }
        
        cashbackLog.buildAmount(cashbackAmount).buildCashbackPercent(cashbackPercent);
          await Repository.UserCashbackLog().update(cashbackLog);

        const userCashback = await Repository.UserCashback().getByUserAndStore(userId, storeId);
        console.log(index,cashbackLog.getId(),store.getName(),wrongCashback,cashbackAmount,cashbackPercent);
        if (userCashback) {
          const updatedCashbackAmount = userCashback.getCashbackAmount() - wrongCashback + cashbackAmount;
          console.log(updatedCashbackAmount);          
          userCashback.buildCashbackAmount(updatedCashbackAmount);
          await Repository.UserCashback().update(userCashback);
          
        }
      }
      
      return context.send.data({});
    } catch (error) {
      return context.send.error(error);
    }
  }
  
}


