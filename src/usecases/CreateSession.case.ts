import {
  BaseCaseInterface,
  BaseCaseParamsInterface,
  Log,
  NotFoundError,
  Repository,
  Token,
  AdminsEntity,
  Password,
  IncorrectPasswordError,
  RoleScopeEnum,
  RoleAssignmentStatusEnum,
  RolesEnum,
  SellersSchema,
} from '@ubaytools/core';
import { Types } from 'mongoose';

export interface CreateSessionCaseParams {
  username: string;
  password: string;
}

interface SessionRoleDto {
  id: string;
  code: string;
  scope: RoleScopeEnum;
  permissions?: string[];
}

export interface CreateSessionCaseResponse {
  token: string;
  seller: string;
  role: SessionRoleDto | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  scope: RoleScopeEnum;
}

class CreateSessionCase implements BaseCaseInterface<CreateSessionCaseParams, CreateSessionCaseResponse> {
  @Log()
  async execute(params: BaseCaseParamsInterface<CreateSessionCaseParams>): Promise<CreateSessionCaseResponse> {
    const admin: AdminsEntity = await Repository.Admins().getByUsername(params.username);
    if (!admin) throw new NotFoundError('Admin');

    const password = new Password().buildHash(admin.getPassword()).buildPassword(params.password);

    if (!(await password.compare())) throw new IncorrectPasswordError();

    const role = admin.getRole() as any;
    let seller: SellersSchema | null = null;
    if (role.getCode() == RolesEnum.SELLER) {
      seller = await Repository.Sellers().findOneRaw({ admin: admin.getId() });
    }

    const roleObj: SessionRoleDto | null = role
      ? {
          id: role?.getId?.()?.toString?.() ?? role?._id?.toString?.() ?? role?.id ?? null,
          code: role?.getCode?.() ?? role?.code ?? role?.name ?? null,
          scope: role?.getScope?.() ?? role?.scope ?? admin.getScope?.() ?? RoleScopeEnum.PLATFORM,
        }
      : null;

    const jwtSecret = String(process.env.JWT_SECRET);
    const jwtExpiryMillis = Number(process.env.JWT_EXPIRY_MS);

    const payload = {
      admin: admin.getId()?.toString() ?? null,
      seller: seller?._id.toString() ?? null,
      role: roleObj,
    };

    const accessToken = new Token(jwtSecret, jwtExpiryMillis, payload).sign();

    return {
      token: accessToken,
      seller: seller?._id.toString() ?? null,
      role: roleObj
        ? {
            ...roleObj,
            permissions: role?.getPermissions?.() || [],
          }
        : null,
      firstName: admin.getFirstName() ?? null,
      lastName: admin.getLastName() ?? null,
      phoneNumber: admin.getPhoneNumber() ?? null,
      scope: admin.getScope() ?? null,
    };
  }
}

export const createSessionCase: BaseCaseInterface<CreateSessionCaseParams, CreateSessionCaseResponse> = new CreateSessionCase();
