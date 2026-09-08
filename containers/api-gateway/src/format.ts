/**
 * Supported API content negotiation formats.
 */
export type ApiFormat = 'msgpack' | 'json'

export const MSGPACK_CONTENT_TYPE = 'application/x-msgpack'
export const JSON_CONTENT_TYPE = 'application/json; charset=utf-8'

export const MSGPACK_MIME_TYPES = [
  'application/x-msgpack',
  'application/msgpack',
]

/**
 * Resolves the requested API content format (json or msgpack) from the URL query params or Accept header.
 * 
 * @param req - The incoming HTTP request.
 * @param url - The parsed request URL.
 * @returns 'msgpack' if MessagePack format is explicitly requested, otherwise 'json'.
 */
export function getRequestedFormat(req: Request, url: URL): ApiFormat {
  const queryFormat = url.searchParams.get('format')
  if (queryFormat && queryFormat.toLowerCase() === 'msgpack') {
    return 'msgpack'
  }
  const accept = req.headers.get('accept') || ''
  if (MSGPACK_MIME_TYPES.some((mime) => accept.includes(mime))) {
    return 'msgpack'
  }
  return 'json'
}

/**
 * Checks whether an upstream Content-Type header corresponds to a cacheable API response payload (JSON or MessagePack).
 * 
 * @param contentType - The Content-Type header string.
 * @returns True if the response is JSON or MessagePack, false otherwise.
 */
export function isSupportedApiContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const lower = contentType.toLowerCase()
  return lower.includes('application/json') || MSGPACK_MIME_TYPES.some((mime) => lower.includes(mime))
}

/**
 * Returns the standard MIME Content-Type header value for a given ApiFormat.
 * 
 * @param format - The resolved API format.
 * @returns The MIME string to serve to clients.
 */
export function getFormatContentType(format: ApiFormat): string {
  return format === 'msgpack' ? MSGPACK_CONTENT_TYPE : JSON_CONTENT_TYPE
}
