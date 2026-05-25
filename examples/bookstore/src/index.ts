import * as path from 'node:path'
import { Backend, InjectMetaMiddleware } from '@quatrain/backend'
import { SQLiteAdapter } from '@quatrain/backend-sqlite'
import { ExpressAdapter } from '@quatrain/api-server'
import { MigrationManager } from '@quatrain/backend-migrations'
import { Log, DefaultLoggerAdapter, LogLevel } from '@quatrain/log'

import { Author } from './models/Author'
import { Editor } from './models/Editor'
import { Book } from './models/Book'
import { AuthorApi } from './api/AuthorApi'
import { EditorApi } from './api/EditorApi'
import { BookApi } from './api/BookApi'

;(async () => {
   try {
      const isProd = process.env.NODE_ENV === 'production'
      Log.addLogger('default', new DefaultLoggerAdapter('', isProd ? LogLevel.INFO : LogLevel.DEBUG), true)
      
      const adapter = new SQLiteAdapter({ 
         config: { database: path.resolve(process.cwd(), "data/app.sqlite") },
         middlewares: [new InjectMetaMiddleware()]
      })

      Backend.addBackend(adapter, 'default', true)
      
      const mm = new MigrationManager(adapter)
      await mm.executeMigrations()
      
      const server = new ExpressAdapter()
      
      server.addEndpoint(AuthorApi, '/api/authors')
      server.addEndpoint(EditorApi, '/api/editors')
      server.addEndpoint(BookApi, '/api/books')



      const PORT = Number(process.env.PORT) || 4001
      server.start(PORT, () => {
         console.log(`🚀 Server started on port ${PORT}`)
      })
   } catch (e) {
      console.error(e)
      process.exit(1)
   }
})()
