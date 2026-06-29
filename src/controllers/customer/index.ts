import CustomerListController from "./CustomerList.controller";
import GetCustomerProfileController from "./GetCustomerProfile.controller";
import UpdateCustomerProfileController from "./UpdateCustomerProfile.controller";
import DeleteCustomerProfileController from "./DeleteCustomerProfile.controller";

export const CustomerControllers = {
  CustomerListController: CustomerListController.controller,
  GetCustomerProfileController: GetCustomerProfileController.controller,
  UpdateCustomerProfileController: UpdateCustomerProfileController.controller,
  DeleteCustomerProfileController: DeleteCustomerProfileController.controller,
};
