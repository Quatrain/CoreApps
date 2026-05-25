import { CrudEndpoint, ValuesEndpoint, ListEndpoint } from '@quatrain/api-server'
import { ServerAdapter, EndpointOptions } from '@quatrain/api'
import { Editor } from '../models/Editor'

export const EditorApi = (router: ServerAdapter, path: string, options: EndpointOptions) => {
   ValuesEndpoint(Editor)(router, path, options)
   ListEndpoint(Editor)(router, path, options)
   CrudEndpoint(Editor)(router, path, options)
}
