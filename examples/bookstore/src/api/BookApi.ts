import { CrudEndpoint, ValuesEndpoint, ListEndpoint } from '@quatrain/api-server'
import { ServerAdapter, EndpointOptions } from '@quatrain/api'
import { Book } from '../models/Book'

export const BookApi = (router: ServerAdapter, path: string, options: EndpointOptions) => {
   ValuesEndpoint(Book)(router, path, options)
   ListEndpoint(Book)(router, path, options)
   CrudEndpoint(Book)(router, path, options)
}
