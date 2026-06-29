import DeleteModelController from './DeleteModel.controller';
import AddModelController from './AddModel.controller';
import ModelListController from './ModelList.controller';
import GetModelDetailController from './GetModelDetail.controller';
import UpdateModelController from './UpdateModel.controller';

export const ModelControllers = {
  ModelListController: ModelListController.controller,
  AddModelController: AddModelController.controller,
  UpdateModelController: UpdateModelController.controller,
  DeleteModelController: DeleteModelController.controller,
  GetModelDetailController: GetModelDetailController.controller,
};
