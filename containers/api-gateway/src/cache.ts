import { RedisCacheAdapter } from '@quatrain/cache-redis'
import { Api } from '@quatrain/api'
import { GATEWAY_MAX_CACHE_BODY_BYTES } from './config'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

/**
 * Global Redis cache adapter backed by @quatrain/cache-redis.
 */
export const cacheAdapter = new RedisCacheAdapter(REDIS_URL)

/**
 * Underlying Redis client instance for direct protocol operations (e.g. scan, info).
 */
export const redis = cacheAdapter.manager.client

/**
 * Retrieves a cached binary or string payload from Redis by its key as a Buffer.
 * 
 * @param key - The unique cache key for the payload.
 * @returns A promise resolving to the cached Buffer, or null if not found or an error occurs.
 */
export async function getCachedPayload(key: string): Promise<Buffer | null> {
  try {
    return await cacheAdapter.getBuffer(key)
  } catch (err) {
    Api.error(`[Redis] Failed to get cache key ${key}:`, err)
    return null
  }
}

/**
 * Stores a binary Buffer or string payload into Redis with a specified time-to-live.
 * Skips caching if the payload size exceeds GATEWAY_MAX_CACHE_BODY_BYTES.
 * 
 * @param key - The unique cache key for the payload.
 * @param data - The Buffer or string data to cache.
 * @param ttlSeconds - Time-to-live in seconds (default is 3600).
 * @returns A promise resolving when the operation completes.
 */
export async function setCachedPayload(key: string, data: Buffer | string, ttlSeconds: number = 3600): Promise<void> {
  const byteLength = Buffer.isBuffer(data) ? data.byteLength : Buffer.byteLength(data, 'utf8')
  if (byteLength > GATEWAY_MAX_CACHE_BODY_BYTES) {
    Api.info(
      `[Redis] Skipping cache for key ${key}: payload size (${(byteLength / 1024).toFixed(1)} KB) exceeds maximum limit (${(GATEWAY_MAX_CACHE_BODY_BYTES / 1024).toFixed(1)} KB)`
    )
    return
  }

  try {
    await cacheAdapter.set(key, data, ttlSeconds)
  } catch (err) {
    Api.error(`[Redis] Failed to set cache key ${key}:`, err)
  }
}

/**
 * Retrieves a binary media buffer from Redis by its key.
 * 
 * @param key - The unique cache key for the media buffer.
 * @returns A promise resolving to the Buffer, or null if not found or an error occurs.
 */
export async function getMediaBuffer(key: string): Promise<Buffer | null> {
  try {
    return await cacheAdapter.getBuffer(key)
  } catch (err) {
    Api.error(`[Redis] Failed to get media buffer for key ${key}:`, err)
    return null
  }
}

/**
 * Stores a binary media buffer into Redis with a specified time-to-live.
 * 
 * @param key - The unique cache key for the media buffer.
 * @param buffer - The binary Buffer to cache.
 * @param ttlSeconds - Time-to-live in seconds (default is 86400).
 * @returns A promise resolving when the operation completes.
 */
export async function setMediaBuffer(key: string, buffer: Buffer, ttlSeconds: number = 86400): Promise<void> {
  try {
    await cacheAdapter.set(key, buffer, ttlSeconds)
  } catch (err) {
    Api.error(`[Redis] Failed to set media buffer for key ${key}:`, err)
  }
}

/**
 * Invalidates all JSON cache keys for a specific resource path across ALL users.
 * 
 * @param path - The resource path (e.g. /api/environments/...)
 * @returns A promise resolving when the operation completes.
 */
export async function invalidateResourceCache(path: string): Promise<void> {
  try {
    const parts = path.split('/')
    if (parts.length < 3) return
    
    // Extract base path, e.g., "/api/environments"
    const basePath = `/${parts[1]}/${parts[2]}`

    let cursor = '0'
    let count = 0
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `api:cache:*:${basePath}*`, 'COUNT', 100)
      cursor = newCursor
      if (keys.length > 0) {
        await cacheAdapter.del(...keys)
        count += keys.length
      }
    } while (cursor !== '0')
    if (count > 0) {
      Api.info(`[Redis] Invalidated ${count} cache keys for resource ${basePath}`)
    }
  } catch (err) {
    Api.error(`[Redis] Failed to invalidate cache for resource ${path}:`, err)
  }
}

let lastUsedMemory = 0
let lastLogTime = 0

/**
 * Periodically retrieves and logs the Redis memory usage statistics.
 * Logs output every minute if the memory footprint has changed, or every 5 minutes as a heartbeat otherwise.
 * 
 * @async
 * @function logCacheStats
 * @returns {Promise<void>} Resolves when the statistics have been evaluated and logged.
 */
async function logCacheStats(): Promise<void> {
  try {
    const memoryInfo = await redis.info('memory')
    
    // Parse the output
    const usedMatch = memoryInfo.match(/used_memory:(\d+)/)
    const maxMatch = memoryInfo.match(/maxmemory:(\d+)/)
    
    if (usedMatch) {
      const usedMemory = Number.parseInt(usedMatch[1], 10)
      const maxMemory = maxMatch ? Number.parseInt(maxMatch[1], 10) : 0
      
      const now = Date.now()
      const timeSinceLastLog = now - lastLogTime
      
      // Log if memory changed OR if 5 minutes have passed
      if (usedMemory !== lastUsedMemory || timeSinceLastLog >= 5 * 60 * 1000) {
        let pct = 'N/A'
        if (maxMemory > 0) {
          pct = ((usedMemory / maxMemory) * 100).toFixed(2) + '%'
        }
        const usedMB = (usedMemory / (1024 * 1024)).toFixed(2)
        const maxMB = maxMemory > 0 ? (maxMemory / (1024 * 1024)).toFixed(2) : 'Unlimited'
        
        Api.info(`[Redis] Cache stats: ${usedMB} MB / ${maxMB} MB (${pct} filled)`)
        
        lastUsedMemory = usedMemory
        lastLogTime = now
      }
    }
  } catch (err) {
    Api.error(`[Redis] Failed to retrieve memory stats:`, err)
  }
}

// Check every minute
setInterval(logCacheStats, 60 * 1000)
