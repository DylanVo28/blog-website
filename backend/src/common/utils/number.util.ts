export function toNumber(value: string | number | bigint | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumNumbers(values: Array<string | number | bigint | null | undefined>): number {
  return values.reduce<number>((total, value) => total + toNumber(value), 0);
}
