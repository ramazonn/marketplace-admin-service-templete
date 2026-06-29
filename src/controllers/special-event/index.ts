import AddSpecialEventController from './AddSpecialEvent.controller';
import SpecialEventListController from './SpecialEventList.controller';
import UpdateSpecialEventController from './UpdateSpecialEvent.controller';
import GetSpecialEventDetailController from './GetSpecialEventDetail.controller';
import DeleteSpecialEventController from './DeleteSpecialEvent.controller';
import InsertProductToSpecialEventController from './InsertProductToSpecialEvent.controller';
import RemoveProductFromSpecialEventController from './RemoveProductFromSpecialEvent.controller';
import ReOrderSpecialEventProductsController from './ReOrderSpecialEventProducts.controller';
  
export const SpecialEventControllers = {
  AddSpecialEventController:AddSpecialEventController.controller,
  SpecialEventListController:SpecialEventListController.controller,
  GetSpecialEventDetailController:GetSpecialEventDetailController.controller,
  DeleteSpecialEventController: DeleteSpecialEventController.controller,
  UpdateSpecialEventController:UpdateSpecialEventController.controller,
//   GetActiveSpecialEventsController:GetActiveSpecialEventsController.controller,
  InsertProductToSpecialEventController:InsertProductToSpecialEventController.controller,
  RemoveProductFromSpecialEventController:RemoveProductFromSpecialEventController.controller,
  ReOrderSpecialEventProductsController:ReOrderSpecialEventProductsController.controller,
}; 