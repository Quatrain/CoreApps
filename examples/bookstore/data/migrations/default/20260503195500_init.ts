import { AbstractBackendAdapter } from '@quatrain/backend'

export const up = async ({ context: adapter }: { context: AbstractBackendAdapter }) => {
   try {
      await adapter.rawQuery(`CREATE TABLE IF NOT EXISTS authors (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            createdat INTEGER,
            updatedat INTEGER,
            deletedat INTEGER,
            createdby TEXT,
            updatedby TEXT,
            deletedby TEXT,
            firstname TEXT,
            lastname TEXT
      )`)

      try {
         await adapter.rawQuery(`ALTER TABLE authors ADD COLUMN firstname TEXT`)
      } catch (e) {
         // Ignore error if column already exists
      }

      try {
         await adapter.rawQuery(`ALTER TABLE authors ADD COLUMN lastname TEXT`)
      } catch (e) {
         // Ignore error if column already exists
      }

      await adapter.rawQuery(`CREATE TABLE IF NOT EXISTS editors (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            createdat INTEGER,
            updatedat INTEGER,
            deletedat INTEGER,
            createdby TEXT,
            updatedby TEXT,
            deletedby TEXT,
            city TEXT
      )`)

      try {
         await adapter.rawQuery(`ALTER TABLE editors ADD COLUMN city TEXT`)
      } catch (e) {
         // Ignore error if column already exists
      }

      await adapter.rawQuery(`CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            createdat INTEGER,
            updatedat INTEGER,
            deletedat INTEGER,
            createdby TEXT,
            updatedby TEXT,
            deletedby TEXT,
            authorauthor TEXT,
            editoreditor TEXT
      )`)

      try {
         await adapter.rawQuery(`ALTER TABLE books ADD COLUMN authorauthor TEXT`)
      } catch (e) {
         // Ignore error if column already exists
      }

      try {
         await adapter.rawQuery(`ALTER TABLE books ADD COLUMN editoreditor TEXT`)
      } catch (e) {
         // Ignore error if column already exists
      }

   } catch (e) {
      console.error('Migration up error', e)
   }
}

export const down = async ({ context: adapter }: { context: AbstractBackendAdapter }) => {
   try {
      await adapter.rawQuery('DROP TABLE IF EXISTS authors')

      await adapter.rawQuery('DROP TABLE IF EXISTS editors')

      await adapter.rawQuery('DROP TABLE IF EXISTS books')

   } catch (e) {
      console.error('Migration down error', e)
   }
}
