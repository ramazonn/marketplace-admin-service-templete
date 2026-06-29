import * as Joi from 'joi';

export class AuthLoginParams {
  username: string;

  /** Пароль (Sha1) */
  password: string;

  constructor(params: any) {
    if (params) {
      this.username = params?.username;
      this.password = params?.password;
    }
  }

  async validate() {
    return await AuthLoginParamsSchema.validateAsync(this);
  }
}

export const AuthLoginParamsSchema = Joi.object<AuthLoginParams>({
  username: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});
