import { describe, expect, it } from 'bun:test'
import { extractUserIdFromAuthHeader, extractAuthHeader } from './jwt'

describe('API Gateway JWT Utilities (jwt.ts)', () => {
  describe('extractUserIdFromAuthHeader', () => {
    const makeJwt = (payload: object): string => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = 'mock_signature'
      return `Bearer ${header}.${body}.${signature}`
    }

    it('should return "public" when authHeader is missing or empty', () => {
      expect(extractUserIdFromAuthHeader(undefined)).toBe('public')
      expect(extractUserIdFromAuthHeader(null)).toBe('public')
      expect(extractUserIdFromAuthHeader('')).toBe('public')
      expect(extractUserIdFromAuthHeader('Basic dXNlcjpwYXNz')).toBe('public')
    })

    it('should return "public" if JWT does not have 3 parts', () => {
      expect(extractUserIdFromAuthHeader('Bearer invalid-token')).toBe('public')
      expect(extractUserIdFromAuthHeader('Bearer part1.part2')).toBe('public')
    })

    it('should extract "sub" as user ID', () => {
      const token = makeJwt({ sub: 'user_12345', name: 'Alice' })
      expect(extractUserIdFromAuthHeader(token)).toBe('user_12345')
    })

    it('should extract "uid" if "sub" is missing', () => {
      const token = makeJwt({ uid: 'firebase_user_999' })
      expect(extractUserIdFromAuthHeader(token)).toBe('firebase_user_999')
    })

    it('should extract "user_id" as fallback', () => {
      const token = makeJwt({ user_id: 'custom_id_777' })
      expect(extractUserIdFromAuthHeader(token)).toBe('custom_id_777')
    })

    it('should return "unknown_user" if payload contains none of sub/uid/user_id', () => {
      const token = makeJwt({ role: 'admin' })
      expect(extractUserIdFromAuthHeader(token)).toBe('unknown_user')
    })

    it('should return "invalid_token" if payload cannot be JSON-parsed', () => {
      const corruptJwt = 'Bearer header.invalid-base64-json.sig'
      expect(extractUserIdFromAuthHeader(corruptJwt)).toBe('invalid_token')
    })
  })

  describe('extractAuthHeader', () => {
    it('should extract from Authorization header with Bearer prefix', () => {
      const req = new Request('http://localhost/', {
        headers: { Authorization: 'Bearer token_abc' }
      })
      const url = new URL(req.url)
      expect(extractAuthHeader(req, url)).toBe('Bearer token_abc')
    })

    it('should normalize Authorization header missing Bearer prefix', () => {
      const req = new Request('http://localhost/', {
        headers: { authorization: 'token_xyz' }
      })
      const url = new URL(req.url)
      expect(extractAuthHeader(req, url)).toBe('Bearer token_xyz')
    })

    it('should extract from alternative headers (x-auth-token, x-access-token)', () => {
      const req1 = new Request('http://localhost/', {
        headers: { 'x-auth-token': 'token_custom' }
      })
      expect(extractAuthHeader(req1, new URL(req1.url))).toBe('Bearer token_custom')

      const req2 = new Request('http://localhost/', {
        headers: { 'x-access-token': 'token_custom2' }
      })
      expect(extractAuthHeader(req2, new URL(req2.url))).toBe('Bearer token_custom2')
    })

    it('should extract from URL query parameters (?token, ?access_token, ?bearer)', () => {
      const req1 = new Request('http://localhost/api/test?token=query_tok1')
      expect(extractAuthHeader(req1, new URL(req1.url))).toBe('Bearer query_tok1')

      const req2 = new Request('http://localhost/api/test?access_token=query_tok2')
      expect(extractAuthHeader(req2, new URL(req2.url))).toBe('Bearer query_tok2')

      const req3 = new Request('http://localhost/api/test?bearer=query_tok3')
      expect(extractAuthHeader(req3, new URL(req3.url))).toBe('Bearer query_tok3')
    })

    it('should return empty string when no auth info is present', () => {
      const req = new Request('http://localhost/api/test')
      expect(extractAuthHeader(req, new URL(req.url))).toBe('')
    })
  })
})
