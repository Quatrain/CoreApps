import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { discoverMigrations, MigrationRunner } from './MigrationRunner'
import type {
  DatabaseMigrationAdapterInterface,
  MigrationConfig,
  MigrationExecutionResult
} from '../types'

describe('discoverMigrations', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qtrn-migrator-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should discover and sort sql files by version prefix', () => {
    fs.writeFileSync(path.join(tmpDir, '20261018000002_create_profiles.sql'), 'SELECT 2;')
    fs.writeFileSync(path.join(tmpDir, '20261018000001_create_users.sql'), 'SELECT 1;')
    fs.writeFileSync(path.join(tmpDir, 'README.md'), 'documentation')

    const migrations = discoverMigrations(tmpDir)
    expect(migrations).toHaveLength(2)
    expect(migrations[0].version).toBe('20261018000001')
    expect(migrations[0].name).toBe('create_users')
    expect(migrations[1].version).toBe('20261018000002')
    expect(migrations[1].name).toBe('create_profiles')
  })

  it('should throw error when migrations directory does not exist', () => {
    expect(() => discoverMigrations('/non/existent/path')).toThrow(/Migrations directory does not exist/)
  })
})

describe('MigrationRunner', () => {
  let tmpDir: string
  let mockAdapter: DatabaseMigrationAdapterInterface
  let executedList: string[]
  let isConnected: boolean

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qtrn-runner-test-'))
    executedList = []
    isConnected = false

    mockAdapter = {
      dialect: 'mock',
      connect: async () => {
        isConnected = true
      },
      disconnect: async () => {
        isConnected = false
      },
      ensureTrackingTable: async () => {},
      getAppliedVersions: async () => new Set(['20261018000001']),
      executeMigration: async (version: string, name: string): Promise<MigrationExecutionResult> => {
        executedList.push(version)
        return {
          version,
          name,
          status: 'applied',
          executedStatements: 1,
          ignoredStatements: 0,
          durationMs: 5
        }
      }
    }
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should skip already applied migrations and execute pending ones', async () => {
    fs.writeFileSync(path.join(tmpDir, '20261018000001_initial.sql'), 'CREATE TABLE a (id int);')
    fs.writeFileSync(path.join(tmpDir, '20261018000002_second.sql'), 'CREATE TABLE b (id int);')

    const config: MigrationConfig = {
      dialect: 'mock',
      migrationsDir: tmpDir,
      trackingSchema: 'public',
      trackingTable: 'schema_migrations',
      dryRun: false,
      postgrestReloadNotify: false,
      connection: {}
    }

    const runner = new MigrationRunner(mockAdapter, config)
    const summary = await runner.run()

    expect(summary.totalDiscovered).toBe(2)
    expect(summary.alreadyApplied).toBe(1)
    expect(summary.newlyApplied).toBe(1)
    expect(summary.recovered).toBe(0)
    expect(executedList).toEqual(['20261018000002'])
    expect(isConnected).toBe(false) // disconnected cleanly
  })

  it('should honor dry-run mode without calling executeMigration', async () => {
    fs.writeFileSync(path.join(tmpDir, '20261018000002_second.sql'), 'CREATE TABLE b (id int);')

    const config: MigrationConfig = {
      dialect: 'mock',
      migrationsDir: tmpDir,
      trackingSchema: 'public',
      trackingTable: 'schema_migrations',
      dryRun: true,
      postgrestReloadNotify: false,
      connection: {}
    }

    const runner = new MigrationRunner(mockAdapter, config)
    const summary = await runner.run()

    expect(summary.totalDiscovered).toBe(1)
    expect(summary.alreadyApplied).toBe(0)
    expect(summary.newlyApplied).toBe(1)
    expect(executedList).toHaveLength(0) // None actually executed in dry run
  })
})
