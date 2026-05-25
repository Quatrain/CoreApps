import { PersistedBaseObject } from '@quatrain/backend'
import { StringProperty } from '@quatrain/core'

export const AuthorProperties = [
   {
      name: 'firstName',
      type: StringProperty.TYPE,
      mandatory: true
   },
   {
      name: 'lastName',
      type: StringProperty.TYPE,
      mandatory: true
   }
]

export class Author extends PersistedBaseObject {
   static PROPS_DEFINITION = AuthorProperties
   static COLLECTION = 'authors'

   static async factory(src: any = undefined): Promise<Author> {
      return super.factory(src, Author)
   }
}
