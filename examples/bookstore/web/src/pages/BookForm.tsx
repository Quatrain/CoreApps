import { CoreForm } from '@quatrain/ux-form-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export function BookForm() {
   const { id } = useParams()
   const navigate = useNavigate()

   const modelSchema = {
   "uid": "c70b836f-d341-4e2d-95a2-ff7d719d9c57",
   "name": "Book",
   "collectionName": "books",
   "properties": [
      {
         "name": "authorAuthor",
         "type": "object",
         "mandatory": 1,
         "options": {
            "instanceOf": "Author"
         },
         "ui": {
            "labels": {
               "en": "Editor",
               "fr": "Editeur"
            }
         }
      },
      {
         "name": "editorEditor",
         "type": "object",
         "mandatory": 1,
         "options": {
            "instanceOf": "Editor"
         },
         "ui": {}
      },
      {
         "name": "name",
         "type": "StringProperty",
         "mandatory": 1,
         "options": {},
         "ui": {
            "labels": {
               "en": "Title",
               "fr": "Titre"
            }
         }
      }
   ]
}

   return (
      <CoreForm 
         modelSchema={modelSchema} 
         objectId={id} 
         apiClient={api} 
         onSave={() => navigate('/books')}
         onCancel={() => navigate('/books')}
      />
   )
}
