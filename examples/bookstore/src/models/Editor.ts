import { PersistedBaseObject } from '@quatrain/backend'
import { StringProperty } from '@quatrain/core'

export const EditorProperties = [
   {
      name: 'city',
      type: StringProperty.TYPE,
      mandatory: false
   }
]

export class Editor extends PersistedBaseObject {
   static PROPS_DEFINITION = EditorProperties
   static COLLECTION = 'editors'

   static async factory(src: any = undefined): Promise<Editor> {
      return super.factory(src, Editor)
   }
}
