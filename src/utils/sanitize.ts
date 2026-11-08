import { MAX_NAME_LENGTH } from "./constants";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

/** Returns a trimmed, length-limited name, or null when the value is unusable. */
export function sanitizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_NAME_LENGTH).trim();
  return trimmed ? trimmed : null;
}

export function sanitizeId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 100
    ? value
    : null;
}
