import { BaseError, ErrorCodeEnum } from '@ubaytools/core';

export class AlreadyExistsError extends BaseError {
  constructor(message: string) {
    super(
      `${message} already exists`,
      {
        en: `${message} already exists`,
        ru: `${message} уже существует`,
        uz: `${message} allaqachon mavjud`,
      },
      ErrorCodeEnum.ALREADY_EXISTS,
    );
  }
}