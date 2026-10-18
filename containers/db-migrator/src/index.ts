import { parseConfig } from './config'
import { createMigrationAdapter } from './adapters'
import { MigrationRunner } from './runner/MigrationRunner'

export * from './types'
export * from './config'
export * from './adapters'
export * from './runner/MigrationRunner'
export * from './splitSqlStatements'

/**
 * Main CLI entrypoint for container execution.
 */
export async function main(): Promise<void> {
  try {
    const config = parseConfig()

    // Fail-fast environment validation
    if (!config.dryRun && !config.connection.url && !config.connection.host) {
      throw new Error(
        '[FAIL-FAST] Missing database connection parameters. Define DATABASE_URL (or PG_HOST, PG_DB, PG_USER).'
      )
    }

    const adapter = createMigrationAdapter(config)
    const runner = new MigrationRunner(adapter, config)

    await runner.run()
    process.exit(0)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.stack || err.message : String(err)
    console.error('\n[FATAL MIGRATOR ERROR]', message)
    process.exit(1)
  }
}

// Auto-run if executed directly as entrypoint
if (import.meta.main || process.env.RUN_CLI === 'true') {
  main()
}
