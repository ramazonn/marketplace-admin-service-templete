import PromotionListController from './PromotionList.controller';
import AddBannerToPromotionController from './AddBannerToPromotion.controller';
import DeletePromotionController from './DeletePromotion.controller';
import UpdatePromotionController from './UpdatePromotion.controller';
import ReOrderBannerPromotionsController from './ReOrderBannerPromotions.controller';

export const PromotionControllers = {
  PromotionListController: PromotionListController.controller,
  AddBannerToPromotionController: AddBannerToPromotionController.controller,
  DeletePromotionController: DeletePromotionController.controller,
  UpdatePromotionController: UpdatePromotionController.controller,
  ReOrderBannerPromotionsController: ReOrderBannerPromotionsController.controller,
};
