import { CoreForm } from '@quatrain/ux-form-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export function EditorForm() {
   const { id } = useParams()
   const navigate = useNavigate()

   const modelSchema = {
   "uid": "ebc85d44-ef3c-4da1-ab18-3a672ba3800d",
   "name": "Editor",
   "collectionName": "editors",
   "properties": [
      {
         "name": "name",
         "type": "string",
         "mandatory": 1,
         "options": {},
         "ui": {}
      },
      {
         "name": "city",
         "type": "string",
         "mandatory": 0,
         "options": {},
         "ui": {}
      }
   ]
}

   return (
      <CoreForm 
         modelSchema={modelSchema} 
         objectId={id} 
         apiClient={api} 
         onSave={() => navigate('/editors')}
         onCancel={() => navigate('/editors')}
      />
   )
}
