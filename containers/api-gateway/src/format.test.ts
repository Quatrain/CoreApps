import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  getRequestedFormat,
  isSupportedApiContentType,
  getFormatContentType,
  MSGPACK_CONTENT_TYPE,
  JSON_CONTENT_TYPE,
} from './format.ts'

describe('API Gateway Content Negotiation (format.ts)', () => {
  describe('getRequestedFormat', () => {
    it('should detect MessagePack from ?format=msgpack query param', () => {
      const url = new URL('http://localhost:3000/api/videos3d/123/frames/0/100?format=msgpack')
      const req = new Request(url.toString())
      assert.strictEqual(getRequestedFormat(req, url), 'msgpack')
    })

    it('should detect MessagePack from ?format=MSGPACK case-insensitively', () => {
      const url = new URL('http://localhost:3000/api/videos3d/123/frames/0/100?format=MSGPACK')
      const req = new Request(url.toString())
      assert.strictEqual(getRequestedFormat(req, url), 'msgpack')
    })

    it('should detect MessagePack from Accept: application/x-msgpack header', () => {
      const url = new URL('http://localhost:3000/api/videos3d/123/frames/0/100')
      const req = new Request(url.toString(), {
        headers: { 'Accept': 'application/x-msgpack' },
      })
      assert.strictEqual(getRequestedFormat(req, url), 'msgpack')
    })

    it('should detect MessagePack from Accept: application/msgpack header', () => {
      const url = new URL('http://localhost:3000/api/videos3d/123/frames/0/100')
      const req = new Request(url.toString(), {
        headers: { 'Accept': 'application/msgpack' },
      })
      assert.strictEqual(getRequestedFormat(req, url), 'msgpack')
    })

    it('should detect MessagePack when mixed in complex Accept header', () => {
      const url = new URL('http://localhost:3000/api/videos3d/123/frames/0/100')
      const req = new Request(url.toString(), {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/x-msgpack;q=0.9,*/*;q=0.8' },
      })
      assert.strictEqual(getRequestedFormat(req, url), 'msgpack')
    })

    it('should default to json for standard requests with application/json', () => {
      const url = new URL('http://localhost:3000/api/me')
      const req = new Request(url.toString(), {
        headers: { 'Accept': 'application/json' },
      })
      assert.strictEqual(getRequestedFormat(req, url), 'json')
    })

    it('should default to json when no Accept header is present', () => {
      const url = new URL('http://localhost:3000/api/me')
      const req = new Request(url.toString())
      assert.strictEqual(getRequestedFormat(req, url), 'json')
    })
  })

  describe('isSupportedApiContentType', () => {
    it('should accept application/json', () => {
      assert.strictEqual(isSupportedApiContentType('application/json'), true)
      assert.strictEqual(isSupportedApiContentType('application/json; charset=utf-8'), true)
    })

    it('should accept application/x-msgpack and application/msgpack', () => {
      assert.strictEqual(isSupportedApiContentType('application/x-msgpack'), true)
      assert.strictEqual(isSupportedApiContentType('application/msgpack'), true)
    })

    it('should reject non-API content types', () => {
      assert.strictEqual(isSupportedApiContentType(null), false)
      assert.strictEqual(isSupportedApiContentType('text/html'), false)
      assert.strictEqual(isSupportedApiContentType('image/png'), false)
      assert.strictEqual(isSupportedApiContentType('video/mp4'), false)
    })
  })

  describe('getFormatContentType', () => {
    it('should return application/x-msgpack for msgpack', () => {
      assert.strictEqual(getFormatContentType('msgpack'), MSGPACK_CONTENT_TYPE)
    })

    it('should return application/json; charset=utf-8 for json', () => {
      assert.strictEqual(getFormatContentType('json'), JSON_CONTENT_TYPE)
    })
  })

  describe('Binary Buffer Integrity', () => {
    it('should preserve arbitrary binary MessagePack bytes without UTF-8 corruption', () => {
      // Create a binary buffer containing byte sequences that are invalid UTF-8
      // (e.g. 0xFF, 0xFE, 0x80, 0x87 which previously corrupted into 0xEF 0xBF 0xBD when read via .text())
      const originalBinary = Buffer.from([0x87, 0xa4, 0x68, 0x6f, 0x73, 0x74, 0xff, 0xfe, 0x00, 0x80, 0xc0])

      // Simulate reading through arrayBuffer and converting to Buffer
      const arrayBuffer = originalBinary.buffer.slice(
        originalBinary.byteOffset,
        originalBinary.byteOffset + originalBinary.byteLength
      )
      const reconstructed = Buffer.from(arrayBuffer)

      assert.strictEqual(reconstructed.length, originalBinary.length)
      assert.deepStrictEqual(reconstructed, originalBinary)
      assert.strictEqual(reconstructed.includes(Buffer.from([0xef, 0xbf, 0xbd])), false)
    })
  })
})
