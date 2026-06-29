import NewsListController from './NewsList.controller';
import AddNewsController from './AddNews.controller';
import UpdateNewsController from './UpdateNews.controller';
import CancelNewsController from './CancelNews.controller';
import DeleteNewsController from './DeleteNews.controller';
import GetNewsByIdController from './GetNewsById.controller';
import MigrateNewsAttachmentsController from './MigrateNewsAttachments.controller';

export const NewsControllers = {
  GetNewsByIdController: GetNewsByIdController.controller,
  NewsListController: NewsListController.controller,
  AddNewsController: AddNewsController.controller,
  UpdateNewsController: UpdateNewsController.controller,
  CancelNewsController: CancelNewsController.controller,
  DeleteNewsController: DeleteNewsController.controller,
  MigrateNewsAttachmentsController: MigrateNewsAttachmentsController.controller,
};
