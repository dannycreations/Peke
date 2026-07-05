import { beforeAll, describe, expect, it } from 'vitest';

let parsePlayCount: (playString: string | null) => number;

beforeAll(async () => {
  globalThis.document = {
    readyState: 'loading',
    addEventListener: () => {},
    querySelector: () => null,
    body: {},
  } as any;

  globalThis.window = {
    location: {
      pathname: '/',
    },
    addEventListener: () => {},
  } as any;

  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  } as any;

  const mod = await import('./index');
  parsePlayCount = mod.parsePlayCount;
});

describe('parsePlayCount', () => {
  it('should parse simple numbers', () => {
    expect(parsePlayCount('123')).toBe(123);
    expect(parsePlayCount('0')).toBe(0);
    expect(parsePlayCount(null)).toBe(0);
    expect(parsePlayCount('   ')).toBe(0);
  });

  it('should parse numbers with K, M, B multipliers', () => {
    expect(parsePlayCount('10K')).toBe(10_000);
    expect(parsePlayCount('1.5M')).toBe(1_500_000);
    expect(parsePlayCount('2.3B')).toBe(2_300_000_000);
  });

  it('should handle plays in the title string', () => {
    expect(parsePlayCount('1.2B plays')).toBe(1_200_000_000);
    expect(parsePlayCount('1.5M plays')).toBe(1_500_000);
    expect(parsePlayCount('10K plays')).toBe(10_000);
  });

  it('should not match multipliers embedded in later words', () => {
    // E.g., "123 Wiedergaben" in German. "Wiedergaben" contains 'B'.
    // It should not treat "B" in "Wiedergaben" as a multiplier.
    expect(parsePlayCount('123 Wiedergaben')).toBe(123);
    // E.g., French "123 vues" (no multiplier)
    expect(parsePlayCount('123 vues')).toBe(123);
  });
});
