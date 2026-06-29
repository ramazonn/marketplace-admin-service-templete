import { Types } from 'mongoose';
import { BaseCaseInterface, Log, BaseCaseParamsInterface, Repository, AdminsEntity, AdminStatusEnum, Token, RoleScopeEnum, SellersEntity } from '@ubaytools/core';
import { AuthorizationError } from '../infrastructure';

export interface CheckClientSessionByAccessTokenParams {
  accessToken: string;
}

export interface SessionRole {
  id: string;
  code: string;
  scope: RoleScopeEnum;
}

export interface CheckClientSessionByAccessTokenResponse {
  admin: AdminsEntity;
  role: SessionRole | null;
  seller: string | null;
}

class CheckClientSessionByAccessTokenCase implements BaseCaseInterface<CheckClientSessionByAccessTokenParams, CheckClientSessionByAccessTokenResponse> {
  @Log()
  async execute(params: BaseCaseParamsInterface<CheckClientSessionByAccessTokenParams>): Promise<CheckClientSessionByAccessTokenResponse> {
    let payload: any;
    try {
      payload = new Token(process.env.JWT_SECRET, Number(process.env.JWT_EXPIRY_MS)).buildToken(params.accessToken).verify();
    } catch (e) {
      throw new AuthorizationError(`Invalid token`);
    }

    const admin = await Repository.Admins().getById(payload.admin as Types.ObjectId);
    if (!admin) throw new AuthorizationError(`Invalid admin`);
    if (admin?.getStatus() !== AdminStatusEnum.ACTIVE) throw new AuthorizationError(`Invalid admin`);
    // user.buildLastActivity(now);     // TODO add lastActivity field for admin
    // await Repository.Admins().update(admin);

    const role = (payload?.role && typeof payload.role === 'object')
      ? (payload.role as SessionRole)
      : null;

      const seller = payload?.seller ? payload?.seller : null
      
    return { admin, role, seller };
  }
}

export const checkClientSessionByAccessTokenCase:
  BaseCaseInterface<CheckClientSessionByAccessTokenParams, CheckClientSessionByAccessTokenResponse> =
  new CheckClientSessionByAccessTokenCase();
