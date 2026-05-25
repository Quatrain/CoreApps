import { useEffect, useState } from 'react'
import { Table, Button, Group, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export function AuthorList() {
   const [data, setData] = useState<any[]>([])
   const navigate = useNavigate()

   useEffect(() => {
      api.get('authors').then((res) => {
         if (res && res.data) {
            setData(res.data)
         }
      })
   }, [])

   const handleDelete = async (id: string) => {
      if (confirm('Are you sure?')) {
         await api.delete('authors/' + id, {})
         setData(data.filter(item => item.uid !== id))
      }
   }

   return (
      <div>
         <Group justify="space-between" mb="md">
            <Title order={2}>Authors</Title>
            <Button onClick={() => navigate('/authors/new')}>Create Author</Button>
         </Group>
         <Table>
            <Table.Thead>
               <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
               </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
               {data.map(item => (
                  <Table.Tr key={item.uid}>
                     <Table.Td>{item.name || item.uid}</Table.Td>
                     <Table.Td>{item.status}</Table.Td>
                     <Table.Td>
                        <Group>
                           <Button size="xs" variant="outline" onClick={() => navigate(`/authors/${item.uid}`)}>Edit</Button>
                           <Button size="xs" color="red" variant="outline" onClick={() => handleDelete(item.uid)}>Delete</Button>
                        </Group>
                     </Table.Td>
                  </Table.Tr>
               ))}
            </Table.Tbody>
         </Table>
      </div>
   )
}
