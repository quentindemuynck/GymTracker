/**
 * Parse a user-typed decimal that may use a comma (e.g. Dutch/Belgian
 * keyboards show "," on the iOS decimal pad) or a dot. Returns null for
 * empty or unparseable input.
 */
export function parseDecimal(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/** Keep only characters that can form a decimal number (digits plus one , or .). */
export function cleanDecimalInput(value: string): string {
  const stripped = value.replace(/[^\d.,]/g, '')
  const sep = stripped.search(/[.,]/)
  if (sep === -1) return stripped
  return stripped.slice(0, sep + 1) + stripped.slice(sep + 1).replace(/[.,]/g, '')
}
