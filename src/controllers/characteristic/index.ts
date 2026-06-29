import CharacteristicListController from './CharacteristicList.controller';
import AddCharacteristicController from './AddCharacteristic.controller';
import SetCharacteristicToCategoriesController from './SetCharacteristicToCategories.controller';
import UpdateCharacteristicController from './UpdateCharacteristic.controller';
import DeleteCharacteristicController from './DeleteCharacteristic.controller';
import GetCharacteristicDetailController from './GetCharacteristicDetail.controller';
import ProductCharacteristicsController from './ProductCharacteristics.controller';

export const CharacteristicControllers = {
  CharacteristicListController: CharacteristicListController.controller,
  GetCharacteristicDetailController: GetCharacteristicDetailController.controller,
  AddCharacteristicController: AddCharacteristicController.controller,
  SetCharacteristicToCategoriesController: SetCharacteristicToCategoriesController.controller,
  UpdateCharacteristicController: UpdateCharacteristicController.controller,
  DeleteCharacteristicController: DeleteCharacteristicController.controller,
  ProductCharacteristicsController: ProductCharacteristicsController.controller,
};
