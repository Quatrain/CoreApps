import { describe, expect, it } from 'bun:test'
import { RedisCacheAdapter } from '@quatrain/cache-redis'
import { cacheAdapter, redis, getCachedPayload, setCachedPayload, getMediaBuffer, setMediaBuffer } from './cache'

describe('API Gateway Cache Adapter (cache.ts)', () => {
  it('should initialize cacheAdapter as a RedisCacheAdapter instance', () => {
    expect(cacheAdapter).toBeInstanceOf(RedisCacheAdapter)
    expect(cacheAdapter.manager).toBeDefined()
    expect(cacheAdapter.manager.client).toBeDefined()
    expect(redis).toBe(cacheAdapter.manager.client)
  })

  it('should expose standard CacheAdapterInterface methods on cacheAdapter', () => {
    expect(typeof cacheAdapter.get).toBe('function')
    expect(typeof cacheAdapter.getBuffer).toBe('function')
    expect(typeof cacheAdapter.set).toBe('function')
    expect(typeof cacheAdapter.del).toBe('function')
    expect(typeof cacheAdapter.keys).toBe('function')
  })

  it('should expose gateway cache helper functions', () => {
    expect(typeof getCachedPayload).toBe('function')
    expect(typeof setCachedPayload).toBe('function')
    expect(typeof getMediaBuffer).toBe('function')
    expect(typeof setMediaBuffer).toBe('function')
  })
})
