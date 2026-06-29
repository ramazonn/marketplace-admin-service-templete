import { Context } from 'koa';
import { Types } from 'mongoose';
import {
  ActionLogFailureReasonEnum,
  ActionTypeEnum,
  RoleScopeEnum,
} from '@ubaytools/core';

export type LogData = object;

export interface ChangeLeaf {
  oldValue: unknown;
  newValue: unknown;
}

export interface ChangesType {
  [key: string]: ChangeLeaf | ChangesType;
}

export interface ActionLogParams {
  context?: Context;
  action: ActionTypeEnum;
  resource: string;
  resourceId?: Types.ObjectId;
  before?: LogData | null;
  after?: LogData | null;
  comment?: string;
  failureReason?: ActionLogFailureReasonEnum;
  errorMessage?: string;
}

export interface ContextMeta {
  actor?: Types.ObjectId;
  actorName?: string;
  role?: string;
  endpoint?: string;
  scope?: RoleScopeEnum;
  store?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface NormalizedLogData {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: ChangesType;
}