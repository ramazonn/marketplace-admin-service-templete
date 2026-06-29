import LifehackListController from './LIfehackList.controller';
import AddLifehackController from './AddLifehack.controller';
import UpdateLifehackController from './UpdateLifehack.controller';
import DeleteLifehackController from './DeleteLIfehack.controller';
import LifehackDetailController from './LifehackDetail.controller';
import AddLifehackCommentReplyController from './AddLifehackCommentReplay.controller';
import DeleteLifehackCommentReplyController from './DeleteLifehackCommentReply.controller';
import DeleteLifehackCommentController from './DeleteLifehackComment.controller';
import GetLifehackCommentsListController from './GetLifehackCommentsList.controller';
import GetLifehackCommentRepliesController from './GetLifehackCommentReplies.controller';
import GetLifehackLikesListController from './GetLifehackLikesList.controller';

export const LifehackControllers = {
  LifehackListController: LifehackListController.controller,
  LifehackDetailController: LifehackDetailController.controller,
  AddLifehackController: AddLifehackController.controller,
  UpdateLifehackController: UpdateLifehackController.controller,
  DeleteLifehackController: DeleteLifehackController.controller,

  AddLifehackCommentReplyController: AddLifehackCommentReplyController.controller,
  DeleteLifehackCommentReplyController: DeleteLifehackCommentReplyController.controller,
  DeleteLifehackCommentController: DeleteLifehackCommentController.controller,
  GetLifehackCommentsListController: GetLifehackCommentsListController.controller,
  GetLifehackCommentRepliesController: GetLifehackCommentRepliesController. controller,
  GetLifehackLikesListController: GetLifehackLikesListController.controller
};
