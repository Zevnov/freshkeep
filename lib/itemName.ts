export const MAX_ITEM_NAME_LENGTH = 120;

const INVISIBLE_NAME_CHARS = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\u200B\u200C\u200D\u2060\uFEFF]/g;

export function normalizeItemName(rawName: string): string {
  return rawName.trim();
}

export function hasVisibleItemName(rawName: string): boolean {
  return normalizeItemName(rawName).replace(INVISIBLE_NAME_CHARS, "").length > 0;
}

export function isValidItemName(rawName: string): boolean {
  const normalized = normalizeItemName(rawName);
  return hasVisibleItemName(normalized) && normalized.length <= MAX_ITEM_NAME_LENGTH;
}
