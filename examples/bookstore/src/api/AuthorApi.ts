import { CrudEndpoint, ValuesEndpoint, ListEndpoint } from '@quatrain/api-server'
import { ServerAdapter, EndpointOptions } from '@quatrain/api'
import { Author } from '../models/Author'

export const AuthorApi = (router: ServerAdapter, path: string, options: EndpointOptions) => {
   ValuesEndpoint(Author)(router, path, options)
   ListEndpoint(Author)(router, path, options)
   CrudEndpoint(Author)(router, path, options)
}
