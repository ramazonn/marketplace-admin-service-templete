import BrandListController from './BrandList.controller';
import AddBrandController from './AddBrand.controller';
import UpdateBrandController from './UpdateBrand.controller';
import DeleteBrandController from './DeleteBrand.controller';
import BrandDetailController from './BrandDetail.controller';

export const BrandControllers = {
  BrandListController: BrandListController.controller,
  BrandDetailController: BrandDetailController.controller,
  AddBrandController: AddBrandController.controller,
  UpdateBrandController: UpdateBrandController.controller,
  DeleteBrandController: DeleteBrandController.controller,
};
