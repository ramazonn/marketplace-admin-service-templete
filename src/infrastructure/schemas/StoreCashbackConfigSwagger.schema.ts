import { StoreCashbackTypeEnum } from "@ubaytools/core";

export const StoreCashbackConfigSwaggerSchema = {
  enabled: { type: 'boolean' },
  type: { type: 'string', example: StoreCashbackTypeEnum.GENERAL, description: Object.values(StoreCashbackTypeEnum).join('|') },
  percent: { type: 'number' },
  includeDiscounted: { type: 'boolean' },
  minimumOrderAmountToUseCashback: { type: 'number' },
};
