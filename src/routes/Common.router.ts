import * as KoaRouter from '@koa/router';
import { CommonControllers } from '../controllers';
import * as multer from '@koa/multer';

const upload = multer();

export const CommonRouter = new KoaRouter().prefix('/common');

CommonRouter.post('/upload-image', upload.single('file'), CommonControllers.UploadImageController);
CommonRouter.post('/upload-video', upload.single('file'), CommonControllers.UploadVideoController);
