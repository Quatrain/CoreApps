/**
 * Core type definitions for @quatrain/db-migrator.
 * Provides agnostic database migration contracts and structures.
 */

export type MigrationDialect = 'postgres' | 'postgresql' | 'supabase' | 'mysql' | 'sqlite' | string

export type MigrationExecutionStatus = 'applied' | 'recovered' | 'skipped'

export interface MigrationRecord {
  version: string
  name: string
  appliedAt?: Date
}

export interface MigrationExecutionResult {
  version: string
  name: string
  status: MigrationExecutionStatus
  executedStatements: number
  ignoredStatements: number
  durationMs: number
}

export interface MigrationRunnerSummary {
  totalDiscovered: number
  alreadyApplied: number
  newlyApplied: number
  recovered: number
  durationMs: number
}

export interface ConnectionConfig {
  url?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  ssl?: boolean
  connectionTimeoutMillis?: number
  maxRetries?: number
  retryIntervalMs?: number
}

export interface MigrationConfig {
  dialect: string
  migrationsDir: string
  trackingSchema: string
  trackingTable: string
  dryRun: boolean
  postgrestReloadNotify: boolean
  connection: ConnectionConfig
}

/**
 * Universal interface for database migration adapters.
 * Implemented by PostgresMigrationAdapter and future adapters (MySQL, SQLite, etc.).
 */
export interface DatabaseMigrationAdapterInterface {
  readonly dialect: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  ensureTrackingTable(): Promise<void>
  getAppliedVersions(): Promise<Set<string>>
  executeMigration(version: string, name: string, sqlContent: string): Promise<MigrationExecutionResult>
  postMigrationNotify?(): Promise<void>
}
