import { describe, expect, it } from 'bun:test'
import { splitSqlStatements } from './splitSqlStatements'

describe('splitSqlStatements', () => {
  it('should split simple statements delimited by semicolons', () => {
    const sql = `
      CREATE TABLE users (id serial PRIMARY KEY, name text);
      CREATE INDEX idx_users_name ON users(name);
    `
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('CREATE TABLE users')
    expect(statements[1]).toContain('CREATE INDEX idx_users_name')
  })

  it('should not split semicolons inside single-quoted strings', () => {
    const sql = `
      INSERT INTO logs (message) VALUES ('Hello; World');
      INSERT INTO logs (message) VALUES ('Another; statement; with; semicolons');
    `
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toBe("INSERT INTO logs (message) VALUES ('Hello; World')")
    expect(statements[1]).toBe("INSERT INTO logs (message) VALUES ('Another; statement; with; semicolons')")
  })

  it('should not split semicolons inside dollar-quoted function blocks ($$)', () => {
    const sql = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain("NEW.updated_at = now();")
    expect(statements[0]).toContain("language 'plpgsql'")
    expect(statements[1]).toContain('CREATE TRIGGER update_users_updated_at')
  })

  it('should handle named dollar-quoted blocks ($func$)', () => {
    const sql = `
      CREATE OR REPLACE FUNCTION test_func() RETURNS void AS $func$
      BEGIN
        PERFORM 1;
        PERFORM 2;
      END;
      $func$ LANGUAGE plpgsql;
    `
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(1)
    expect(statements[0]).toContain('$func$')
    expect(statements[0]).toContain('PERFORM 1;')
  })

  it('should preserve line and block comments without breaking', () => {
    const sql = `
      -- First table comment with semicolon; inside
      CREATE TABLE orders (id int);
      /* Multi-line
         comment with ; inside */
      CREATE TABLE items (id int);
    `
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('CREATE TABLE orders')
    expect(statements[1]).toContain('CREATE TABLE items')
  })

  it('should handle trailing statement without semicolon', () => {
    const sql = `SELECT 1; SELECT 2`
    const statements = splitSqlStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toBe('SELECT 1')
    expect(statements[1]).toBe('SELECT 2')
  })
})
