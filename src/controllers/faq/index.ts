import FAQListController from './FAQList.controller';
import AddFAQController from './AddFAQ.controller';
import UpdateFAQController from './UpdateFAQ.controller';
import DeleteFAQController from './DeleteFAQ.controller';
import GetFAQByIdController from './GetFAQById.controller';

export const FAQControllers = {
  GetFAQByIdController: GetFAQByIdController.controller,
  FAQListController: FAQListController.controller,
  AddFAQController: AddFAQController.controller,
  UpdateFAQController: UpdateFAQController.controller,
  DeleteFAQController: DeleteFAQController.controller,
};
