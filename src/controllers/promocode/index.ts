import AddPromoCodeController from './AddPromoCode.controller';
import UpdatePromoCodeController from './UpdatePromoCode.controller';
import DeletePromoCodeController from './DeletePromoCode.controller';
import TogglePromoCodeStatusController from './TogglePromoCodeStatus.controller';
import GetPromoCodeByIdController from './GetPromoCodeById.controller';
import PromoCodeListController from './PromoCodeList.controller';
import PromoCodeStatsController from './PromoCodeStats.controller';

export const PromoCodeControllers = {
  AddPromoCodeController: AddPromoCodeController.controller,
  UpdatePromoCodeController: UpdatePromoCodeController.controller,
  DeletePromoCodeController: DeletePromoCodeController.controller,
  TogglePromoCodeStatusController: TogglePromoCodeStatusController.controller,
  GetPromoCodeByIdController: GetPromoCodeByIdController.controller,
  PromoCodeListController: PromoCodeListController.controller,
  PromoCodeStatsController: PromoCodeStatsController.controller,
};


