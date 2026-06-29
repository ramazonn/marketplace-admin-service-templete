import AdminListController from './AdminList.controller';
import UpdateAdminController from './UpdateAdmin.controller';
import DeleteAdminController from './DeleteAdmin.controller';
import AdminDetailController from './AdminDetail.controller';
import AddAdminController from './AddAdmin.controller';

export const AdminControllers = {
  AdminListController: AdminListController.controller,
  AdminDetailController: AdminDetailController.controller,
  AddAdminController: AddAdminController.controller,
  UpdateAdminController: UpdateAdminController.controller,
  DeleteAdminController: DeleteAdminController.controller,
};
