export type CustomerSegment = 'none' | 'first-time' | 'repeat';

export function customerSearchTerms(
  displayName: string | null,
  email: string | null,
): string[] {
  const values = [displayName, email]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => [value.trim().toLowerCase(), ...tokens(value)]);
  return [...new Set(values)].slice(0, 30);
}

export function customerSegment(orderCount: number): CustomerSegment {
  if (orderCount < 1) return 'none';
  return orderCount === 1 ? 'first-time' : 'repeat';
}

export function storedCount(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0;
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9@._+-]+/)
    .filter(Boolean);
}
