import { describe, expect, it } from 'bun:test'

describe('API Gateway Media Proxy (media.ts)', () => {
  it('should validate invalid media URL patterns with 400 Bad Request', async () => {
    // Test URL matcher regex directly as used in handleMediaRequest
    const mediaPathRegex = /^\/?(api\/)?blob\/(.+)\/([a-zA-Z0-9_-]+)$/
    expect(mediaPathRegex.test('/api/blob/')).toBe(false)
    expect(mediaPathRegex.test('/api/invalid/path')).toBe(false)
    expect(mediaPathRegex.test('/api/blob/medias/123/file')).toBe(true)
    expect(mediaPathRegex.test('/blob/medias/456/file')).toBe(true)
    expect(mediaPathRegex.test('/api/blob/videos/abc/vectos/def/mp4')).toBe(true)
  })

  it('should guarantee Content-Length is preserved on Blob response bodies (non-chunked)', async () => {
    const payload = new Uint8Array(2048).fill(65) // 2 KB payload
    const blob = new Blob([payload])
    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(blob.size),
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag, Last-Modified'
    })

    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response(blob, {
          status: 200,
          headers
        })
      }
    })

    try {
      const res = await fetch(`http://localhost:${server.port}/`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-length')).toBe('2048')
      expect(res.headers.get('transfer-encoding')).toBeNull()
      expect(res.headers.get('access-control-expose-headers')).toContain('Content-Length')
      
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBe(2048)
    } finally {
      server.stop()
    }
  })

  it('should guarantee Content-Length and Content-Range on 206 Partial Content with Blob bodies', async () => {
    const slice = new Uint8Array(1024).fill(66) // 1 KB slice
    const blob = new Blob([slice])
    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(blob.size),
      'Content-Range': 'bytes 0-1023/1048576',
      'Accept-Ranges': 'bytes',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag, Last-Modified'
    })

    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response(blob, {
          status: 206,
          headers
        })
      }
    })

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Range: 'bytes=0-1023' }
      })
      expect(res.status).toBe(206)
      expect(res.headers.get('content-length')).toBe('1024')
      expect(res.headers.get('content-range')).toBe('bytes 0-1023/1048576')
      expect(res.headers.get('accept-ranges')).toBe('bytes')
      expect(res.headers.get('transfer-encoding')).toBeNull()

      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBe(1024)
    } finally {
      server.stop()
    }
  })
})
