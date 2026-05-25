import { ApiClient } from '@quatrain/api-client'

const apiUrl = import.meta.env.VITE_API_URL || '/api'
export const api = new ApiClient(apiUrl)
