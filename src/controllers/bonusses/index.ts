import AddBonussesController from './AddBonusses.controller';
import UpdateBonussesController from './UpdateBonusses.controller';
import DeleteBonussesController from './DeleteBonusses.controller';
import BonussesDetailController from './BonussesDetail.controller';
import BonussesListController from './BonussesList.controller';

export const BonussesControllers = {
  AddBonussesController: AddBonussesController.controller,
  UpdateBonussesController: UpdateBonussesController.controller,
  DeleteBonussesController: DeleteBonussesController.controller,
  BonussesDetailController: BonussesDetailController.controller,
  BonussesListController: BonussesListController.controller,
};
