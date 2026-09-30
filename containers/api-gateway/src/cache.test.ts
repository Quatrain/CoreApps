import { describe, expect, it, spyOn } from 'bun:test'
import { RedisCacheAdapter } from '@quatrain/cache-redis'
import {
  cacheAdapter,
  redis,
  getCachedPayload,
  setCachedPayload,
  getMediaBuffer,
  setMediaBuffer,
  invalidateResourceCache
} from './cache'

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

  it('should get and set cached payloads via cacheAdapter', async () => {
    const getBufferSpy = spyOn(cacheAdapter, 'getBuffer').mockImplementation(async () => Buffer.from('{"hello":"world"}'))
    const setSpy = spyOn(cacheAdapter, 'set').mockImplementation(async () => {})

    const res = await getCachedPayload('api:cache:test')
    expect(res).toBeDefined()
    expect(res?.toString('utf8')).toBe('{"hello":"world"}')
    expect(getBufferSpy).toHaveBeenCalledWith('api:cache:test')

    await setCachedPayload('api:cache:test', '{"hello":"world"}', 300)
    expect(setSpy).toHaveBeenCalledWith('api:cache:test', '{"hello":"world"}', 300)

    getBufferSpy.mockRestore()
    setSpy.mockRestore()
  })

  it('should skip caching payloads exceeding GATEWAY_MAX_CACHE_BODY_BYTES', async () => {
    const setSpy = spyOn(cacheAdapter, 'set').mockImplementation(async () => {})
    // Default is 1MB, let's create a 1.5MB buffer
    const largeBuffer = Buffer.alloc(1.5 * 1024 * 1024)

    await setCachedPayload('api:cache:huge', largeBuffer)
    expect(setSpy).not.toHaveBeenCalled()

    setSpy.mockRestore()
  })

  it('should get and set media buffers via cacheAdapter', async () => {
    const mediaData = Buffer.from([1, 2, 3, 4, 5])
    const getBufferSpy = spyOn(cacheAdapter, 'getBuffer').mockImplementation(async () => mediaData)
    const setSpy = spyOn(cacheAdapter, 'set').mockImplementation(async () => {})

    const res = await getMediaBuffer('media:photo:file')
    expect(res).toBe(mediaData)
    expect(getBufferSpy).toHaveBeenCalledWith('media:photo:file')

    await setMediaBuffer('media:photo:file', mediaData, 86400)
    expect(setSpy).toHaveBeenCalledWith('media:photo:file', mediaData, 86400)

    getBufferSpy.mockRestore()
    setSpy.mockRestore()
  })

  it('should invalidate resource cache keys by scanning and deleting', async () => {
    let scanCount = 0
    const scanSpy = spyOn(redis, 'scan').mockImplementation(async (cursor: string) => {
      scanCount++
      if (scanCount === 1) {
        return ['10', ['api:cache:user1:/api/items/1', 'api:cache:user2:/api/items/2']]
      }
      return ['0', []]
    })
    const delSpy = spyOn(cacheAdapter, 'del').mockImplementation(async () => {})

    await invalidateResourceCache('/api/items/1')

    expect(scanSpy).toHaveBeenCalled()
    expect(delSpy).toHaveBeenCalledWith('api:cache:user1:/api/items/1', 'api:cache:user2:/api/items/2')

    scanSpy.mockRestore()
    delSpy.mockRestore()
  })

  it('should ignore resource invalidation for paths with fewer than 3 segments', async () => {
    const scanSpy = spyOn(redis, 'scan').mockImplementation(async () => ['0', []])
    await invalidateResourceCache('/health')
    expect(scanSpy).not.toHaveBeenCalled()
    scanSpy.mockRestore()
  })
})
