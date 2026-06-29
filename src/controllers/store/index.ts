import StoreListController from "./StoreList.controller";
import GetStoreDetailController from "./GetStoreDetail.controller";
import AddStoreController from "./AddStore.controller";
import UpdateStoreController from "./UpdateStore.controller";
import DeleteStoreController from "./DeleteStore.controller";

export const StoreControllers = {
  StoreListController: StoreListController.controller,
  GetStoreDetailController: GetStoreDetailController.controller,
  AddStoreController: AddStoreController.controller,
  UpdateStoreController: UpdateStoreController.controller,
  DeleteStoreController: DeleteStoreController.controller,
};
