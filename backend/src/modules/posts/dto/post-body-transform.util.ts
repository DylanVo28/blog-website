export function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function parseJsonObjectField(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    return JSON.parse(normalized);
  } catch {
    return value;
  }
}

export function parseStringArrayField(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === 'string'
          ? item
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
          : [],
      )
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return normalized
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}
