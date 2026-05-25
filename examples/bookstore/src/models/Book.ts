import { PersistedBaseObject } from '@quatrain/backend'
import { ObjectProperty } from '@quatrain/core'

export const BookProperties = [
   {
      name: 'authorAuthor',
      type: ObjectProperty.TYPE,
      mandatory: true
   },
   {
      name: 'editorEditor',
      type: ObjectProperty.TYPE,
      mandatory: true
   }
]

export class Book extends PersistedBaseObject {
   static PROPS_DEFINITION = BookProperties
   static COLLECTION = 'books'

   static async factory(src: any = undefined): Promise<Book> {
      return super.factory(src, Book)
   }
}
