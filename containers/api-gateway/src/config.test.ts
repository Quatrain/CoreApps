import { describe, expect, it } from 'bun:test'

describe('API Gateway Configuration (config.ts)', () => {
  it('should parse numeric IDLE_TIMEOUT correctly', () => {
    const parseIdleTimeout = (val?: string, fallback?: string): number => {
      const envIdleTimeout = val ?? fallback
      if (envIdleTimeout === undefined) return 0
      const parsed = Number.parseInt(envIdleTimeout, 10)
      return Number.isNaN(parsed) ? 0 : parsed
    }

    expect(parseIdleTimeout(undefined, undefined)).toBe(0)
    expect(parseIdleTimeout('30')).toBe(30)
    expect(parseIdleTimeout('0')).toBe(0)
    expect(parseIdleTimeout('invalid')).toBe(0)
    expect(parseIdleTimeout(undefined, '60')).toBe(60)
    expect(parseIdleTimeout('45', '60')).toBe(45)
  })
})
