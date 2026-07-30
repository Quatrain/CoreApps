import { Api } from '@quatrain/api'

/**
 * Extracts the user ID from a Bearer authorization header.
 * Decodes the JWT payload without verifying its signature to quickly retrieve the user ID for caching purposes.
 * 
 * @param authHeader - The raw Authorization header string (e.g., 'Bearer <token>').
 * @returns The extracted user ID (usually 'sub' or 'uid'), or a fallback string if extraction fails or is missing.
 */
export function extractUserIdFromAuthHeader(authHeader?: string | null): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'public'
  }

  const token = authHeader.substring(7)
  const parts = token.split('.')
  
  if (parts.length !== 3) {
    return 'public'
  }

  try {
    // Base64Url decode the payload
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8')
    const payload = JSON.parse(payloadStr)
    
    // Most auth providers put user ID in 'sub', some might use 'uid' or 'user_id'
    return payload.sub || payload.uid || payload.user_id || 'unknown_user'
  } catch (err) {
    Api.error('[JWT] Failed to decode JWT payload:', err)
    return 'invalid_token'
  }
}

/**
 * Extracts and normalizes the Authorization Bearer header from HTTP request headers or URL query parameters.
 * Supports legacy query params (token, access_token, bearer) as well as modern authorization headers.
 * 
 * @param req - The incoming Fetch API Request.
 * @param url - The parsed URL object.
 * @returns A formatted 'Bearer <token>' string or an empty string if no token was found.
 */
export function extractAuthHeader(req: Request, url: URL): string {
  const rawAuthHeader = req.headers.get('authorization') || req.headers.get('Authorization') || req.headers.get('x-auth-token') || req.headers.get('x-access-token')
  const tokenQuery = url.searchParams.get('token') || url.searchParams.get('access_token') || url.searchParams.get('bearer')

  if (rawAuthHeader) {
    return rawAuthHeader.startsWith('Bearer ') ? rawAuthHeader : `Bearer ${rawAuthHeader}`
  }
  if (tokenQuery) {
    return `Bearer ${tokenQuery}`
  }
  return ''
}
