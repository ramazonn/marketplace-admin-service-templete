import AddRoleController from './AddRole.controller';
import RolesListController from './RolesList.controller';
import GetRoleDetailController from './GetRoleDetail.controller';
import UpdateRoleController from './UpdateRole.controller';
import DeleteRoleController from './DeleteRole.controller';

export const RoleControllers = {
    AddRoleController: AddRoleController.controller,
    RolesListController: RolesListController.controller,
    GetRoleDetailController: GetRoleDetailController.controller,
    UpdateRoleController: UpdateRoleController.controller,
    DeleteRoleController: DeleteRoleController.controller,
};