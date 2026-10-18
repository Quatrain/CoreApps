import { PostgresMigrationAdapter } from './PostgresMigrationAdapter'
import type { DatabaseMigrationAdapterInterface, MigrationConfig } from '../types'

export * from './PostgresMigrationAdapter'

/**
 * Factory creating the appropriate database migration adapter based on dialect configuration.
 * Extensible for future adapters (MySQL, SQLite, etc.).
 */
export function createMigrationAdapter(config: MigrationConfig): DatabaseMigrationAdapterInterface {
  const dialect = config.dialect.toLowerCase()

  switch (dialect) {
    case 'postgres':
    case 'postgresql':
    case 'supabase':
      return new PostgresMigrationAdapter(config)

    default:
      throw new Error(
        `[ADAPTER FACTORY] Unsupported database dialect: "${config.dialect}". Currently supported: postgres (postgresql, supabase).`
      )
  }
}
