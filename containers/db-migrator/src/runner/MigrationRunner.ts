import * as fs from 'node:fs'
import * as path from 'node:path'
import type {
  DatabaseMigrationAdapterInterface,
  MigrationConfig,
  MigrationRunnerSummary
} from '../types'

export interface DiscoveredMigration {
  filename: string
  filePath: string
  version: string
  name: string
}

/**
 * Discovers and parses SQL migration files from directory.
 */
export function discoverMigrations(migrationsDir: string): DiscoveredMigration[] {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`[MIGRATION RUNNER] Migrations directory does not exist: "${migrationsDir}"`)
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))

  return files.map((file) => {
    const versionMatch = file.match(/^(\d+)(?:_(.*))?\.sql$/)
    const version = versionMatch ? versionMatch[1] : file.replace('.sql', '')
    const name = versionMatch && versionMatch[2] ? versionMatch[2] : file.replace('.sql', '')

    return {
      filename: file,
      filePath: path.join(migrationsDir, file),
      version,
      name
    }
  })
}

/**
 * Core agnostic database migration runner.
 * Orchestrates file discovery, adapter connection, idempotency checks, and execution.
 */
export class MigrationRunner {
  constructor(
    private readonly adapter: DatabaseMigrationAdapterInterface,
    private readonly config: MigrationConfig
  ) {}

  async run(): Promise<MigrationRunnerSummary> {
    const startTime = Date.now()

    console.log('====================================================')
    console.log('  Quatrain Agnostic Database Migration Runner')
    console.log(`  Engine: [${this.adapter.dialect.toUpperCase()}] | Mode: [${this.config.dryRun ? 'DRY-RUN' : 'LIVE'}]`)
    console.log('====================================================')

    const migrations = discoverMigrations(this.config.migrationsDir)
    console.log(`[DISCOVERY] Discovered ${migrations.length} migration file(s) in: ${this.config.migrationsDir}`)

    if (migrations.length === 0) {
      console.log('[INFO] No SQL migration files found. Nothing to do.')
      return {
        totalDiscovered: 0,
        alreadyApplied: 0,
        newlyApplied: 0,
        recovered: 0,
        durationMs: Date.now() - startTime
      }
    }

    await this.adapter.connect()

    try {
      await this.adapter.ensureTrackingTable()
      const appliedVersions = await this.adapter.getAppliedVersions()
      console.log(`[TRACKING] Found ${appliedVersions.size} previously applied migration(s) in database.`)

      let alreadyApplied = 0
      let newlyApplied = 0
      let recovered = 0

      for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) {
          console.log(`[ALREADY RECORDED] Skipping ${migration.filename} (version: ${migration.version})`)
          alreadyApplied++
          continue
        }

        console.log(`\n----------------------------------------------------`)
        console.log(`[PROCESS] File: ${migration.filename}`)
        console.log(`          Version: ${migration.version} | Name: ${migration.name}`)

        if (this.config.dryRun) {
          console.log(`[DRY RUN] Would execute ${migration.filename}`)
          newlyApplied++
          continue
        }

        const sqlContent = fs.readFileSync(migration.filePath, 'utf-8')
        const result = await this.adapter.executeMigration(
          migration.version,
          migration.name,
          sqlContent
        )

        if (result.status === 'applied') {
          newlyApplied++
        } else if (result.status === 'recovered') {
          recovered++
        }
      }

      if ((newlyApplied > 0 || recovered > 0) && this.adapter.postMigrationNotify) {
        await this.adapter.postMigrationNotify()
      }

      const totalDuration = Date.now() - startTime
      console.log(`\n====================================================`)
      console.log(`Migration Execution Summary:`)
      console.log(`  - Total discovered:       ${migrations.length}`)
      console.log(`  - Already up-to-date:     ${alreadyApplied}`)
      console.log(`  - Newly applied:          ${newlyApplied}`)
      console.log(`  - Recovered pre-existing: ${recovered}`)
      console.log(`  - Total execution time:   ${totalDuration}ms`)
      console.log(`====================================================\n`)

      return {
        totalDiscovered: migrations.length,
        alreadyApplied,
        newlyApplied,
        recovered,
        durationMs: totalDuration
      }
    } finally {
      await this.adapter.disconnect()
    }
  }
}
