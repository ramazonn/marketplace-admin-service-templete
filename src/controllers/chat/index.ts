import DeleteChatController from './DeleteChat.controller';
import GetChatListController from './GetChatList.controller';
import GetChatMessagesController from './GetChatMessages.controller';
import WriteMessageController from './WriteMessage.controller';
import SetMessageToReadController from './SetMessageToRead.controller';
import GetChatDetailController from './GetChatDetail.controller';
import CreateChatController from './CreateChat.controller';

export const ChatControllers = {
  DeleteChatController: DeleteChatController.controller,
  GetChatListController: GetChatListController.controller,
  GetChatMessagesController: GetChatMessagesController.controller,
  SetMessageToReadController: SetMessageToReadController.controller,
  WriteMessageController: WriteMessageController.controller,
  GetChatDetailController: GetChatDetailController.controller,
  CreateChatController: CreateChatController.controller,
};
