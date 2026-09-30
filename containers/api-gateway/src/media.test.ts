import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { handleMediaRequest } from './media'

describe('API Gateway Media Proxy (media.ts)', () => {
  let mockServer: ReturnType<typeof Bun.serve>
  let mockPort: number

  beforeAll(() => {
    mockPort = 8080
    // Spin up an in-process mock server for both internal API upstream and storage
    mockServer = Bun.serve({
      port: 8080,
      async fetch(req) {
        const url = new URL(req.url)

        // 1. Upstream Internal Media Authorization Endpoint
        if (url.pathname.startsWith('/internal/')) {
          if (url.pathname.endsWith('unauthorized-media')) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (url.pathname.endsWith('excluded-mime-media')) {
            return new Response(JSON.stringify({
              url: `http://localhost:${mockPort}/storage/excluded.zip`,
              mimeType: 'application/zip',
              size: 5000
            }), {
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (url.pathname.endsWith('standard-binary-media')) {
            return new Response(JSON.stringify({
              url: `http://localhost:${mockPort}/storage/asset.bundle`,
              mimeType: 'application/octet-stream',
              size: 4096
            }), {
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (url.pathname.endsWith('image-cached-media')) {
            return new Response(JSON.stringify({
              url: `http://localhost:${mockPort}/storage/photo.jpg`,
              mimeType: 'image/jpeg',
              size: 1024
            }), {
              headers: { 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
        }

        // 2. Storage Download Endpoint
        if (url.pathname.startsWith('/storage/')) {
          const range = req.headers.get('range')
          const totalSize = 4096
          const dummyData = new Uint8Array(totalSize).fill(42)

          if (range) {
            const match = range.match(/bytes=(\d+)-(\d+)?/)
            const start = match ? parseInt(match[1], 10) : 0
            const end = match && match[2] ? parseInt(match[2], 10) : totalSize - 1
            const slice = dummyData.slice(start, end + 1)

            return new Response(slice, {
              status: 206,
              headers: {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Content-Length': String(slice.length),
                'Content-Type': 'application/octet-stream',
                'Accept-Ranges': 'bytes',
                'ETag': '"mock-etag"',
                'Last-Modified': 'Wed, 30 Sep 2026 12:00:00 GMT'
              }
            })
          }

          return new Response(dummyData, {
            status: 200,
            headers: {
              'Content-Length': String(totalSize),
              'Content-Type': 'application/octet-stream',
              'Accept-Ranges': 'bytes',
              'ETag': '"mock-etag"',
              'Last-Modified': 'Wed, 30 Sep 2026 12:00:00 GMT'
            }
          })
        }

        return new Response('Not Found', { status: 404 })
      }
    })

    mockPort = mockServer.port
    // Point upstream API to mock server
    process.env.API_UPSTREAM_URL = `http://localhost:${mockPort}`
  })

  afterAll(() => {
    mockServer?.stop()
  })

  it('should reject invalid media URL patterns with 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/invalid/path')
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(400)
  })

  it('should immediately return 204 with CORS and Expose-Headers on OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/blob/medias/123/file', {
      method: 'OPTIONS'
    })
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(res.headers.get('access-control-expose-headers')).toContain('Content-Length')
  })

  it('should forward upstream authorization error (403)', async () => {
    const req = new Request('http://localhost/api/blob/medias/unauthorized-media/file', {
      headers: { Authorization: 'Bearer test_token' }
    })
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(403)
  })

  it('should redirect (302) to storage URL when MIME type is excluded', async () => {
    // GATEWAY_EXCLUDED_MIMES contains application/zip
    const req = new Request('http://localhost/api/blob/medias/excluded-mime-media/file')
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`http://localhost:${mockPort}/storage/excluded.zip`)
  })

  it('should deliver binary file with explicit Content-Length (no chunked transfer) for Unity/BestHTTP', async () => {
    const req = new Request('http://localhost/api/blob/medias/standard-binary-media/file')
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-length')).toBe('4096')
    expect(res.headers.get('transfer-encoding')).toBeNull()
    expect(res.headers.get('access-control-expose-headers')).toContain('Content-Length')

    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBe(4096)
  })

  it('should support Range requests (206 Partial Content) with Content-Range and Content-Length', async () => {
    const req = new Request('http://localhost/api/blob/medias/standard-binary-media/file', {
      headers: { Range: 'bytes=0-1023' }
    })
    const res = await handleMediaRequest(req, new URL(req.url))
    expect(res.status).toBe(206)
    expect(res.headers.get('content-length')).toBe('1024')
    expect(res.headers.get('content-range')).toBe('bytes 0-1023/4096')
    expect(res.headers.get('accept-ranges')).toBe('bytes')
    expect(res.headers.get('transfer-encoding')).toBeNull()

    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBe(1024)
  })
})
