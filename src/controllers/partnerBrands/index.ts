import PartnerBrandsListController from './PartnerBrandsList.controller';
import AddPartnerBrandsController from './AddPartnerBrands.controller';
import UpdatePartnerBrandsController from './UpdatePartnerBrands.controller';
import DeletePartnerBrandsController from './DeletePartnerBrands.controller';
import PartnerBrandsDetailController from './PartnerBrandsDetail.controller';

export const PartnerBrandsControllers = {
  PartnerBrandsListController: PartnerBrandsListController.controller,
  PartnerBrandsDetailController: PartnerBrandsDetailController.controller,
  AddPartnerBrandsController: AddPartnerBrandsController.controller,
  UpdatePartnerBrandsController: UpdatePartnerBrandsController.controller,
  DeletePartnerBrandsController: DeletePartnerBrandsController.controller,
};

