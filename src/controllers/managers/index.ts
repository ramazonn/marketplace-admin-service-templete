import AddManagerController from './AddManager.controller';
import GetManagerDetailController from './GetManagerDetail.controller';
import GetManagerListController from './GetManagerList.controller';
import DeleteManagerController from './DeleteManager.controller';
import UpdateManagerController from './UpdateManager.controller';
import MigrateManagersStatsController from './MigrateManagersStats.controller';

export const ManagersControllers = {
  AddManagerController: AddManagerController.controller,
  GetManagerDetailController: GetManagerDetailController.controller,
  GetManagerListController: GetManagerListController.controller,
  DeleteManagerController: DeleteManagerController.controller,
  UpdateManagerController: UpdateManagerController.controller,
  MigrateManagersStatsController: MigrateManagersStatsController.controller,
};
