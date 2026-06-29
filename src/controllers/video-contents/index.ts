
import VideoContentListController from './VideoContentList.controller';
import videoContentDetailController from './VideoContentDetail.controller';
import AddVideoContentController from './AddVideoContent.controller';
import UpdateVideoContentController from './UpdateVideoContent.controller';
import DeleteVideContentController from './DeleteVideoContent.controller';

export const VideContentControllers = {
  VideContentListController: VideoContentListController.controller,
  VideContentDetailController: videoContentDetailController.controller,
  AddVideContentController: AddVideoContentController.controller,
  UpdateVideContentController: UpdateVideoContentController.controller,
  DeleteVideContentController: DeleteVideContentController.controller,
};
