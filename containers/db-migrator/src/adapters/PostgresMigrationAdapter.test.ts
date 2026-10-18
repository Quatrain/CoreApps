import { describe, expect, it } from 'bun:test'
import { isAlreadyExistsError, PostgresMigrationAdapter } from './PostgresMigrationAdapter'
import { createMigrationAdapter } from './index'
import { parseConfig } from '../config'

describe('isAlreadyExistsError', () => {
  it('should detect duplicate table code 42P07', () => {
    expect(isAlreadyExistsError({ code: '42P07' })).toBe(true)
  })

  it('should detect duplicate column code 42701', () => {
    expect(isAlreadyExistsError({ code: '42701' })).toBe(true)
  })

  it('should detect duplicate object code 42710', () => {
    expect(isAlreadyExistsError({ code: '42710' })).toBe(true)
  })

  it('should detect duplicate schema code 42P06', () => {
    expect(isAlreadyExistsError({ code: '42P06' })).toBe(true)
  })

  it('should detect unique violation code 23505', () => {
    expect(isAlreadyExistsError({ code: '23505' })).toBe(true)
  })

  it('should detect relation already exists message in English', () => {
    expect(isAlreadyExistsError({ message: 'relation "users" already exists' })).toBe(true)
  })

  it('should detect already exists message in French', () => {
    expect(isAlreadyExistsError({ message: 'la table "parcelles" existe déjà' })).toBe(true)
  })

  it('should detect duplicate key message', () => {
    expect(isAlreadyExistsError({ message: 'duplicate key value violates unique constraint' })).toBe(true)
  })

  it('should return false for syntax or connection errors', () => {
    expect(isAlreadyExistsError({ code: '42601', message: 'syntax error at or near "SELECTT"' })).toBe(false)
    expect(isAlreadyExistsError({ code: '08006', message: 'connection failure' })).toBe(false)
    expect(isAlreadyExistsError(null)).toBe(false)
    expect(isAlreadyExistsError(undefined)).toBe(false)
  })
})

describe('createMigrationAdapter', () => {
  it('should create PostgresMigrationAdapter for postgres dialect', () => {
    const config = parseConfig({ DB_DIALECT: 'postgres', MIGRATIONS_DIR: '/tmp' })
    const adapter = createMigrationAdapter(config)
    expect(adapter).toBeInstanceOf(PostgresMigrationAdapter)
    expect(adapter.dialect).toBe('postgres')
  })

  it('should create PostgresMigrationAdapter for supabase dialect', () => {
    const config = parseConfig({ DB_DIALECT: 'supabase', MIGRATIONS_DIR: '/tmp' })
    const adapter = createMigrationAdapter(config)
    expect(adapter).toBeInstanceOf(PostgresMigrationAdapter)
  })

  it('should throw actionable error for unsupported dialect', () => {
    const config = parseConfig({ DB_DIALECT: 'cassandra', MIGRATIONS_DIR: '/tmp' })
    expect(() => createMigrationAdapter(config)).toThrow(/Unsupported database dialect: "cassandra"/)
  })
})
