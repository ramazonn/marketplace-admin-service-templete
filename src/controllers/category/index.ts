import CategoryListController from './CategoryList.controller';
import AddCategoryController from './AddCategory.controller';
import UpdateCategoryController from './UpdateCategory.controller';
import DeleteCategoryController from './DeleteCategory.controller';
import GetCategoryByIdController from './GetCategoryById.controller';
import GetAllCategoryRecursiveController from "./GetAllCategoryRecursive.controller";

export const CategoryControllers = {
  CategoryListController: CategoryListController.controller,
  GetAllCategoryRecursiveController: GetAllCategoryRecursiveController.controller,
  GetCategoryByIdController: GetCategoryByIdController.controller,
  AddCategoryController: AddCategoryController.controller,
  UpdateCategoryController: UpdateCategoryController.controller,
  DeleteCategoryController: DeleteCategoryController.controller,
};
