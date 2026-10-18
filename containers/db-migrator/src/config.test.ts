import { describe, expect, it } from 'bun:test'
import { parseConfig } from './config'

describe('parseConfig', () => {
  it('should parse standard PostgreSQL default configuration', () => {
    const config = parseConfig({
      MIGRATIONS_DIR: '/custom/migrations'
    })
    expect(config.dialect).toBe('postgres')
    expect(config.trackingSchema).toBe('public')
    expect(config.trackingTable).toBe('schema_migrations')
    expect(config.dryRun).toBe(false)
    expect(config.postgrestReloadNotify).toBe(false)
    expect(config.migrationsDir).toBe('/custom/migrations')
  })

  it('should adapt tracking schema and PostgREST reload for supabase dialect', () => {
    const config = parseConfig({
      DB_DIALECT: 'supabase',
      MIGRATIONS_DIR: '/custom/migrations'
    })
    expect(config.dialect).toBe('postgres')
    expect(config.trackingSchema).toBe('supabase_migrations')
    expect(config.trackingTable).toBe('schema_migrations')
    expect(config.postgrestReloadNotify).toBe(true)
  })

  it('should enable SSL for cloud poolers like supabase.co or neon.tech', () => {
    const config = parseConfig({
      PG_HOST: 'db.abcdefgh.supabase.co',
      MIGRATIONS_DIR: '/custom/migrations'
    })
    expect(config.connection.ssl).toBe(true)
  })

  it('should support explicit DATABASE_URL', () => {
    const config = parseConfig({
      DATABASE_URL: 'postgresql://admin:secret@pg.cluster:5432/myapp',
      MIGRATIONS_DIR: '/custom/migrations'
    })
    expect(config.connection.url).toBe('postgresql://admin:secret@pg.cluster:5432/myapp')
  })

  it('should respect custom TRACKING_SCHEMA and TRACKING_TABLE', () => {
    const config = parseConfig({
      TRACKING_SCHEMA: 'core_schema',
      TRACKING_TABLE: 'applied_migrations',
      DRY_RUN: 'true',
      POSTGREST_RELOAD_NOTIFY: 'false',
      MIGRATIONS_DIR: '/custom/migrations'
    })
    expect(config.trackingSchema).toBe('core_schema')
    expect(config.trackingTable).toBe('applied_migrations')
    expect(config.dryRun).toBe(true)
    expect(config.postgrestReloadNotify).toBe(false)
  })
})
