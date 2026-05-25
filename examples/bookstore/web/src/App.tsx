import { AppShell, Burger, Group, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Routes, Route } from 'react-router-dom'
import { AuthorList } from './pages/AuthorList'
import { AuthorForm } from './pages/AuthorForm'
import { EditorList } from './pages/EditorList'
import { EditorForm } from './pages/EditorForm'
import { BookList } from './pages/BookList'
import { BookForm } from './pages/BookForm'

export default function App() {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Quatrain App</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
          <a href="/authors" style={{display: 'block', padding: '10px', color: 'white', textDecoration: 'none'}}>Authors</a>
          <a href="/editors" style={{display: 'block', padding: '10px', color: 'white', textDecoration: 'none'}}>Editors</a>
          <a href="/books" style={{display: 'block', padding: '10px', color: 'white', textDecoration: 'none'}}>Books</a>
      </AppShell.Navbar>

      <AppShell.Main>
         <Routes>
            <Route path="/authors" element={<AuthorList />} />
            <Route path="/authors/:id" element={<AuthorForm />} />
            <Route path="/editors" element={<EditorList />} />
            <Route path="/editors/:id" element={<EditorForm />} />
            <Route path="/books" element={<BookList />} />
            <Route path="/books/:id" element={<BookForm />} />
            <Route path="/" element={<div>Welcome to your Quatrain Application</div>} />
         </Routes>
      </AppShell.Main>
    </AppShell>
  )
}
