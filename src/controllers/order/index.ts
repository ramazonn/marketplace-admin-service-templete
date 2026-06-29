import OrderListController from './OrderList.controller';
import DownloadInExcelController from './DownloadInExcel.controller';
import OrderDetailController from './OrderDetail.controller';
import OrdersByClientController from './OrdersByClient.controller';
import CancelOrderController from './CancelOrder.controller';
import UpdateOrderController from './UpdateOrder.controller';
import DownloadOrderItemsInExcelIncludingSapPriceController from './DownloadOrderItemsInExcelIncludingSapPrice.controller';
import RetryFailedJobController from './RetryFailedJob.controller';
import SendReadyPickupPushController from './SendReadyPickupPush.controller';
import AddUserNoteController from './AddOrderUserNote.controller';
import UserNotesListController from './UserNoteDetail.controller';

export const OrderControllers = {
  OrderListController: OrderListController.controller,
  DownloadInExcelController: DownloadInExcelController.controller,
  DownloadOrderItemsInExcelIncludingSapPriceController: DownloadOrderItemsInExcelIncludingSapPriceController.controller,
  OrderDetailController: OrderDetailController.controller,
  OrdersByClientController: OrdersByClientController.controller,
  CancelOrderController: CancelOrderController.controller,
  UpdateOrderController: UpdateOrderController.controller,
  RetryFailedJobController: RetryFailedJobController.controller,
  SendReadyPickupPushController: SendReadyPickupPushController.controller,
  AddUserNoteController: AddUserNoteController.controller,
  UserNotesListController: UserNotesListController.controller
};
