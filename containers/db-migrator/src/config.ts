import * as path from 'node:path'
import type { MigrationConfig } from './types'

/**
 * Parses and returns migration configuration from environment variables.
 */
export function parseConfig(env: Record<string, string | undefined> = process.env): MigrationConfig {
  const rawDialect = (env.DB_DIALECT || 'postgres').toLowerCase().trim()
  const isSupabase = rawDialect === 'supabase'
  const dialect = isSupabase ? 'postgres' : rawDialect

  const host = env.PG_HOST || env.PGHOST || 'localhost'
  const port = parseInt(env.PG_PORT || env.PGPORT || '5432', 10)
  const user = env.PG_USER || env.PGUSER || 'postgres'
  const database = env.PG_DB || env.PGDATABASE || 'postgres'
  const password = env.PG_PASSWORD || env.PGPWD || env.PGPASSWORD || ''

  const url = env.DATABASE_URL || env.PG_URL

  // Cloud poolers or explicit SSL
  const isCloudHost =
    host.includes('supabase.co') ||
    host.includes('supabase.com') ||
    host.includes('neon.tech') ||
    host.includes('rds.amazonaws.com')
  const ssl = isCloudHost || env.PG_SSL === 'true' || env.PGSSL === 'true'

  const defaultTrackingSchema = isSupabase ? 'supabase_migrations' : 'public'
  const trackingSchema = env.TRACKING_SCHEMA || defaultTrackingSchema
  const trackingTable = env.TRACKING_TABLE || 'schema_migrations'

  const dryRun = env.DRY_RUN === 'true'

  // PostgREST reload notify is auto-enabled when using supabase_migrations or explicit env
  const postgrestReloadNotify =
    env.POSTGREST_RELOAD_NOTIFY !== undefined
      ? env.POSTGREST_RELOAD_NOTIFY === 'true'
      : trackingSchema === 'supabase_migrations'

  const defaultMigrationsDir = process.env.NODE_ENV === 'test'
    ? path.join(process.cwd(), 'migrations')
    : (env.MIGRATIONS_DIR || '/app/migrations')

  const migrationsDir = path.resolve(env.MIGRATIONS_DIR || defaultMigrationsDir)

  const connectionTimeoutMillis = parseInt(env.PG_CONNECT_TIMEOUT_MS || '15000', 10)
  const maxRetries = parseInt(env.PG_CONNECT_MAX_RETRIES || '30', 10)
  const retryIntervalMs = parseInt(env.PG_CONNECT_RETRY_INTERVAL_MS || '2000', 10)

  return {
    dialect,
    migrationsDir,
    trackingSchema,
    trackingTable,
    dryRun,
    postgrestReloadNotify,
    connection: {
      url,
      host,
      port,
      user,
      password,
      database,
      ssl,
      connectionTimeoutMillis,
      maxRetries,
      retryIntervalMs
    }
  }
}
