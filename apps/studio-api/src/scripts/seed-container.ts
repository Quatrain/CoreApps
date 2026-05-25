import path from 'node:path'
import { Backend, InjectMetaMiddleware } from '@quatrain/backend'
import { SQLiteAdapter } from '@quatrain/backend-sqlite'
import { StudioBackend, StudioStorage } from '@quatrain/studio'
import { Api } from '@quatrain/api'
import { HistoryMiddleware } from '../middlewares/HistoryMiddleware'

export async function seedContainer() {
   const dataDir = process.env.STUDIO_DATA_DIR || path.resolve(process.cwd(), 'data')
   const sqlitePath = path.join(dataDir, 'quatrain-studio.sqlite')
   const adapter = new SQLiteAdapter({ 
      config: { database: sqlitePath },
      middlewares: [new InjectMetaMiddleware(), new HistoryMiddleware()],
      softDelete: false
   })
   Backend.addBackend(adapter, 'default', true)

   const backends = await StudioBackend.query().execute()
   if (backends.meta.count === 0) {
      Api.info('Pre-seeding StudioBackend (sqlite) and StudioStorage (local)...')
      
      const backend = await StudioBackend.factory()
      backend.set('name', 'Local SQLite')
      backend.set('engine', 'sqlite')
      backend.set('filePath', path.join(dataDir, 'quatrain-client.sqlite'))
      backend.set('isDefault', true)
      await backend.save()

      const storageDir = process.env.STUDIO_STORAGE_DIR || path.resolve(process.cwd(), 'data/storage')
      const storage = await StudioStorage.factory()
      storage.set('name', 'Local Storage')
      storage.set('provider', 'local')
      storage.set('options', { basePath: storageDir })
      storage.set('isDefault', true)
      await storage.save()
      
      Api.info('Seeding complete.')
   } else {
      Api.info('StudioBackend already exists, skipping seed.')
   }
}
