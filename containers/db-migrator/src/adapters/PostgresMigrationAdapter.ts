import { Client, type ClientConfig } from 'pg'
import { splitSqlStatements } from '../splitSqlStatements'
import type {
  DatabaseMigrationAdapterInterface,
  MigrationConfig,
  MigrationExecutionResult
} from '../types'

/**
 * Checks if a PostgreSQL error indicates that the database object (table, column, index,
 * type, policy, or constraint) or unique value already exists, or is permission-ignorable.
 */
export function isAlreadyExistsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false

  const pgErr = err as { code?: string; message?: string; detail?: string }

  // Postgres SQLSTATE error codes:
  // 42P07: duplicate_table (relation already exists)
  // 42701: duplicate_column (column already exists)
  // 42710: duplicate_object (type, index, constraint, policy already exists)
  // 42P06: duplicate_schema (schema already exists)
  // 42723: duplicate_function (function already exists)
  // 42P16: duplicate_alias (alias already exists)
  // 23505: unique_violation (e.g. duplicate key on pre-inserted seeds)
  const duplicateCodes = ['42P07', '42701', '42710', '42P06', '42723', '42P16', '23505']
  if (pgErr.code && duplicateCodes.includes(pgErr.code)) {
    return true
  }

  const message = `${pgErr.message || ''} ${pgErr.detail || ''}`
  const duplicatePatterns = [
    /already exists/i,
    /existe déjà/i,
    /duplicate (key|column|table|object|relation)/i,
    /relation ".*" already exists/i,
    /column ".*" of relation ".*" already exists/i,
    /constraint ".*" for relation ".*" already exists/i,
    /index ".*" already exists/i,
    /must be owner of (relation|table|type|sequence|view|function)/i,
    /must be a? ?member of (role|group)/i,
    /permission denied for (relation|table|sequence|schema)/i
  ]

  return duplicatePatterns.some((pattern) => pattern.test(message))
}

/**
 * PostgreSQL / Supabase migration adapter.
 * Provides resilient two-tier execution: full-file transaction execution with
 * statement-by-statement recovery for pre-existing schema artifacts.
 */
export class PostgresMigrationAdapter implements DatabaseMigrationAdapterInterface {
  readonly dialect = 'postgres'
  private client: Client | null = null

  constructor(private readonly config: MigrationConfig) {}

  /**
   * Connects to PostgreSQL with automatic retries.
   */
  async connect(): Promise<void> {
    const conn = this.config.connection
    let clientConfig: ClientConfig

    if (conn.url) {
      clientConfig = {
        connectionString: conn.url,
        ssl: conn.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: conn.connectionTimeoutMillis || 15000
      }
    } else {
      clientConfig = {
        host: conn.host,
        port: conn.port,
        user: conn.user,
        password: conn.password,
        database: conn.database,
        ssl: conn.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: conn.connectionTimeoutMillis || 15000
      }
    }

    const maxRetries = conn.maxRetries || 30
    const retryIntervalMs = conn.retryIntervalMs || 2000

    const targetDesc = conn.url
      ? conn.url.replace(/:\/\/[^@]+@/, '://***@')
      : `${conn.host}:${conn.port}/${conn.database} (user: ${conn.user})`

    console.log(`[POSTGRES] Connecting to ${targetDesc} [SSL: ${!!conn.ssl}]...`)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const candidate = new Client(clientConfig)
        await candidate.connect()
        this.client = candidate
        console.log('[POSTGRES] Connected successfully.')
        return
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        if (attempt === maxRetries) {
          console.error(`[POSTGRES] Failed to connect after ${maxRetries} attempts: ${errorMsg}`)
          throw err
        }
        console.warn(
          `[POSTGRES] [RETRY ${attempt}/${maxRetries}] Database not ready (${errorMsg}). Retrying in ${retryIntervalMs / 1000}s...`
        )
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
      }
    }
  }

  /**
   * Closes active database client connection.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }

  /**
   * Ensures tracking schema and migration history table exist.
   */
  async ensureTrackingTable(): Promise<void> {
    this.assertConnected()
    const schema = this.sanitizeIdentifier(this.config.trackingSchema)
    const table = this.sanitizeIdentifier(this.config.trackingTable)

    console.log(`[POSTGRES] Ensuring tracking table "${schema}"."${table}" exists...`)
    await this.client!.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`)
    await this.client!.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (
        version text PRIMARY KEY,
        statements text[],
        name text,
        applied_at timestamptz DEFAULT now()
      );
    `)
  }

  /**
   * Retrieves the set of already applied migration versions.
   */
  async getAppliedVersions(): Promise<Set<string>> {
    this.assertConnected()
    const schema = this.sanitizeIdentifier(this.config.trackingSchema)
    const table = this.sanitizeIdentifier(this.config.trackingTable)

    const res = await this.client!.query<{ version: string }>(
      `SELECT version FROM "${schema}"."${table}"`
    )
    return new Set<string>(res.rows.map((row) => row.version))
  }

  /**
   * Executes a single migration file.
   * Tiers:
   * 1. Full-file execution.
   * 2. Statement-by-statement recovery if recoverable error occurs.
   */
  async executeMigration(
    version: string,
    name: string,
    sqlContent: string
  ): Promise<MigrationExecutionResult> {
    this.assertConnected()
    const startTime = Date.now()

    // TIER 1: Full-file execution
    try {
      await this.client!.query(sqlContent)
      await this.recordMigration(version, name)
      const durationMs = Date.now() - startTime
      console.log(`[SUCCESS] Migration ${version} (${name}) applied in ${durationMs}ms.`)
      return {
        version,
        name,
        status: 'applied',
        executedStatements: 1,
        ignoredStatements: 0,
        durationMs
      }
    } catch (err: unknown) {
      const pgErr = err as { code?: string; message?: string; detail?: string }
      const isRecoverable =
        isAlreadyExistsError(pgErr) ||
        pgErr.code === '25001' ||
        /cannot run inside a transaction block/i.test(pgErr.message || '')

      if (!isRecoverable) {
        console.error(`[FATAL] Migration ${version} (${name}) failed with unexpected error: ${pgErr.message || err}`)
        if (pgErr.detail) console.error(`[DETAIL] ${pgErr.detail}`)
        throw err
      }

      console.warn(`[WARNING] Migration ${version} failed initial execution: ${pgErr.message || err}`)
      console.log(`[FALLBACK] Initiating statement-by-statement recovery for ${version}...`)

      // Rollback any aborted transaction block so client can execute fallback statements
      try {
        await this.client!.query('ROLLBACK')
      } catch {
        // Ignore if no transaction was active
      }

      // TIER 2: Statement-by-statement execution
      const statements = splitSqlStatements(sqlContent)
      let executedStatements = 0
      let ignoredStatements = 0

      for (const stmt of statements) {
        const cleanStmt = stmt.trim()
        if (/^(BEGIN|COMMIT|START TRANSACTION|END);?$/i.test(cleanStmt)) {
          continue
        }

        try {
          await this.client!.query(cleanStmt)
          executedStatements++
        } catch (stmtErr: unknown) {
          try {
            await this.client!.query('ROLLBACK')
          } catch {
            // Ignore
          }

          const statementPgErr = stmtErr as { code?: string; message?: string }

          // Check if INDEX CONCURRENTLY failed due to transaction block
          if (
            (statementPgErr.code === '25001' ||
              /cannot run inside a transaction block/i.test(statementPgErr.message || '')) &&
            /\bINDEX\s+CONCURRENTLY\b/i.test(cleanStmt)
          ) {
            console.warn(`  [RETRY WITHOUT CONCURRENTLY] Retrying index statement synchronously...`)
            const fallbackStmt = cleanStmt.replace(/\bINDEX\s+CONCURRENTLY\b/gi, 'INDEX')
            try {
              await this.client!.query(fallbackStmt)
              executedStatements++
              continue
            } catch (retryErr: unknown) {
              if (isAlreadyExistsError(retryErr)) {
                const msg = retryErr instanceof Error ? retryErr.message : String(retryErr)
                console.log(`  [IGNORED PRE-EXISTING] ${msg.trim()} (Statement: "${cleanStmt.slice(0, 60)}...")`)
                ignoredStatements++
                continue
              }
              throw retryErr
            }
          }

          if (isAlreadyExistsError(statementPgErr)) {
            const msg = statementPgErr.message || String(stmtErr)
            console.log(`  [IGNORED PRE-EXISTING] ${msg.trim()} (Statement: "${cleanStmt.slice(0, 60)}...")`)
            ignoredStatements++
          } else {
            console.error(`  [FAILED] Statement failed: ${statementPgErr.message || stmtErr}`)
            console.error(`  Statement: ${cleanStmt}`)
            throw stmtErr
          }
        }
      }

      await this.recordMigration(version, name)
      const durationMs = Date.now() - startTime
      console.log(
        `[RECOVERED] Migration ${version} (${name}) marked as applied (${executedStatements} executed, ${ignoredStatements} pre-existing ignored) in ${durationMs}ms.`
      )

      return {
        version,
        name,
        status: 'recovered',
        executedStatements,
        ignoredStatements,
        durationMs
      }
    }
  }

  /**
   * Reloads PostgREST schema cache if configured.
   */
  async postMigrationNotify(): Promise<void> {
    if (!this.config.postgrestReloadNotify) return
    this.assertConnected()
    try {
      console.log("[POSTGRES] Notifying PostgREST to reload schema cache (NOTIFY pgrst, 'reload schema')...")
      await this.client!.query("NOTIFY pgrst, 'reload schema';")
    } catch (err: unknown) {
      console.warn(`[POSTGRES] Failed to notify PostgREST schema reload: ${err instanceof Error ? err.message : err}`)
    }
  }

  private async recordMigration(version: string, name: string): Promise<void> {
    const schema = this.sanitizeIdentifier(this.config.trackingSchema)
    const table = this.sanitizeIdentifier(this.config.trackingTable)
    await this.client!.query(
      `INSERT INTO "${schema}"."${table}" (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
      [version, name]
    )
  }

  private sanitizeIdentifier(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '')
  }

  private assertConnected(): void {
    if (!this.client) {
      throw new Error('[POSTGRES] Migration adapter is not connected. Call connect() first.')
    }
  }
}
