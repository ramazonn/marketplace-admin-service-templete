import * as KoaRouter from '@koa/router';
import { RoleAssignmentControllers } from '../controllers';
import { CheckClientSessionMiddleware } from '../middlewares';

export const RoleAssignmentsRouter = new KoaRouter().prefix('/role-assignments');

RoleAssignmentsRouter.post('/assign',  CheckClientSessionMiddleware(),
RoleAssignmentControllers.AssignRoleController
);