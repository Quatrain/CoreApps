import { CoreForm } from '@quatrain/ux-form-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export function AuthorForm() {
   const { id } = useParams()
   const navigate = useNavigate()

   const modelSchema = {
   "uid": "07a97c0d-fd19-4bb2-be37-02367ed989e6",
   "name": "Author",
   "collectionName": "authors",
   "properties": [
      {
         "name": "firstName",
         "type": "string",
         "mandatory": 1,
         "options": {},
         "ui": {
            "labels": {
               "en": "First Name",
               "fr": "Prénom"
            }
         }
      },
      {
         "name": "lastName",
         "type": "string",
         "mandatory": 1,
         "options": {},
         "ui": {
            "labels": {
               "en": "Last Name",
               "fr": "Nom"
            }
         }
      },
      {
         "name": "name",
         "type": "StringProperty",
         "mandatory": 1,
         "options": {},
         "ui": {
            "labels": {}
         }
      }
   ]
}

   return (
      <CoreForm 
         modelSchema={modelSchema} 
         objectId={id} 
         apiClient={api} 
         onSave={() => navigate('/authors')}
         onCancel={() => navigate('/authors')}
      />
   )
}
