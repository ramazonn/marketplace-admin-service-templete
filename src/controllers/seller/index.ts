import SellerListController from "./SellerList.controller";
import GetSellerDetailController from "./GetSellerDetail.controller";
import AddSellerController from "./AddSeller.controller";
import UpdateSellerController from "./UpdateSeller.controller";
import DeleteSellerController from "./DeleteSeller.controller";

export const SellerControllers = {
  SellerListController: SellerListController.controller,
  GetSellerDetailController: GetSellerDetailController.controller,
  AddSellerController: AddSellerController.controller,
  UpdateSellerController: UpdateSellerController.controller,
  DeleteSellerController: DeleteSellerController.controller,
};
