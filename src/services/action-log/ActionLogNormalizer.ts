import { Types } from 'mongoose';
import {
  ChangeLeaf,
  ChangesType,
  LogData,
} from '../../infrastructure/interfaces/action-log.interface';

export class ActionLogNormalizer {
  private static readonly IGNORED_FIELDS = new Set([
    'createdAt',
    'updatedAt',
    '__v',
    '_createdAt',
    '_updatedAt',

    'username',
    'password',
    'token',
    'otp',
    'secret',
    'secretKey',
    'secret_key',
    'accessToken',
    'refreshToken',
    'access_token',
    'refresh_token',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'cvv',
    'cvc',
    'pin',
    'pan',
    'card',
    'cardNumber',
    'card_number',
    'expiry',
    'expire',
    'expireDate',
    'expiryDate',
  ]);

  private static readonly SENSITIVE_FIELD_PARTS = [
    'password',
    'token',
    'otp',
    'secret',
    'apikey',
    'api_key',
    'privatekey',
    'private_key',
    'card',
    'pan',
    'cvv',
    'cvc',
    'pin',
    'expiry',
    'expire',
  ];

  static normalizeLogData(
    data?: LogData | null,
  ): Record<string, unknown> | null | undefined {
    if (data === undefined) return undefined;
    if (data === null) return null;

    const normalized = this.normalizeValue(data);

    if (this.isPlainObject(normalized)) {
      return normalized;
    }

    return { value: normalized };
  }

  static extractChanges(
    before?: LogData | null,
    after?: LogData | null,
  ): ChangesType | undefined {
    if (!before || !after) return undefined;

    const normalizedBefore = this.normalizeLogData(before);
    const normalizedAfter = this.normalizeLogData(after);

    if (!normalizedBefore || !normalizedAfter) return undefined;

    const changes = this.diffValues(normalizedBefore, normalizedAfter);

    if (!changes || this.isChangeLeaf(changes)) {
      return undefined;
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }

  private static diffValues(
    oldValue: unknown,
    newValue: unknown,
  ): ChangesType | ChangeLeaf | undefined {
    const oldIsObject = this.isPlainObject(oldValue);
    const newIsObject = this.isPlainObject(newValue);

    if (oldIsObject && newIsObject) {
      const result: ChangesType = {};
      const keys = new Set([
        ...Object.keys(oldValue),
        ...Object.keys(newValue),
      ]);

      for (const key of keys) {
        if (this.shouldIgnoreField(key)) {
          continue;
        }

        const childDiff = this.diffValues(oldValue[key], newValue[key]);

        if (childDiff !== undefined) {
          result[key] = childDiff;
        }
      }

      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (!this.isEqual(oldValue, newValue)) {
      return {
        oldValue,
        newValue,
      };
    }

    return undefined;
  }

  private static isChangeLeaf(value: unknown): value is ChangeLeaf {
    return (
      !!value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'oldValue' in value &&
      'newValue' in value
    );
  }

  private static normalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (this.isBsonLikeObjectId(value)) {
      return this.stringifyUnknownId(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item));
    }

    if (this.isPlainObject(value)) {
      const normalized: Record<string, unknown> = {};

      for (const key of Object.keys(value).sort()) {
        if (this.shouldIgnoreField(key)) {
          continue;
        }

        normalized[key] = this.normalizeValue(value[key]);
      }

      return normalized;
    }

    return value;
  }

  private static shouldIgnoreField(key: string): boolean {
    if (this.IGNORED_FIELDS.has(key)) {
      return true;
    }

    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');

    return this.SENSITIVE_FIELD_PARTS.some((part) =>
      normalizedKey.includes(part.replace(/[\s_-]/g, '')),
    );
  }

  private static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  private static isEqual(a: unknown, b: unknown): boolean {
    return this.stableStringify(a) === this.stableStringify(b);
  }

  private static stableStringify(value: unknown): string {
    return JSON.stringify(this.sortRecursively(value));
  }

  private static sortRecursively(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortRecursively(item));
    }

    if (this.isPlainObject(value)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(value).sort()) {
        sorted[key] = this.sortRecursively(value[key]);
      }
      return sorted;
    }

    return value;
  }

  private static stringifyUnknownId(id: unknown): string | undefined {
    if (id instanceof Types.ObjectId) {
      return id.toString();
    }

    if (typeof id === 'string') {
      return id;
    }

    if (this.isBsonLikeObjectId(id)) {
      return (id as { toString: () => string }).toString();
    }

    if (id && typeof (id as { toString?: () => string }).toString === 'function') {
      const str = (id as { toString: () => string }).toString();
      return str === '[object Object]' ? undefined : str;
    }

    return undefined;
  }

  private static isBsonLikeObjectId(value: unknown): boolean {
    return (
      !!value &&
      typeof value === 'object' &&
      (
        (value as { _bsontype?: string })._bsontype === 'ObjectId' ||
        (value as { constructor?: { name?: string } }).constructor?.name === 'ObjectId'
      )
    );
  }
}