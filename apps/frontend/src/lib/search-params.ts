/**
 * URL search params utilities for Next.js
 */

export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function allParams(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

export function parseNumber(
  value: string | undefined,
  options?: { min?: number; max?: number },
): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;

  if (options?.min !== undefined && num < options.min) return undefined;
  if (options?.max !== undefined && num > options.max) return undefined;

  return num;
}

export function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

export function parseCommaParam(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function toggleCommaValue(
  currentValue: string | undefined,
  toggle: string,
): string {
  const values = new Set(parseCommaParam(currentValue));
  if (values.has(toggle)) {
    values.delete(toggle);
  } else {
    values.add(toggle);
  }
  return Array.from(values).join(",");
}

export function buildHref(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
): string {
  const url = new URL(basePath, "http://localhost");
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        url.searchParams.append(key, v);
      }
    } else {
      url.searchParams.set(key, value);
    }
  }
  return url.pathname + url.search;
}
