/**
 * Splits a SQL script into individual executable statements,
 * taking into account dollar-quoted blocks ($$...$$ or $tag$...$tag$),
 * string literals ('...'), line comments (-- ...), and block comments (/* ... *\/).
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingleQuote = false
  let inDollarQuote: string | null = null
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const next = i + 1 < sql.length ? sql[i + 1] : ''

    // Handle line comments
    if (!inSingleQuote && !inDollarQuote && !inBlockComment) {
      if (char === '-' && next === '-') {
        inLineComment = true
      }
    }
    if (inLineComment) {
      if (char === '\n') inLineComment = false
      current += char
      continue
    }

    // Handle block comments
    if (!inSingleQuote && !inDollarQuote && !inLineComment) {
      if (char === '/' && next === '*') {
        inBlockComment = true
      }
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        current += '*/'
        i++
        continue
      }
      current += char
      continue
    }

    // Handle single quotes
    if (!inDollarQuote) {
      if (char === "'" && (i === 0 || sql[i - 1] !== '\\')) {
        inSingleQuote = !inSingleQuote
      }
    }

    // Handle dollar quotes ($tag$...$tag$)
    if (!inSingleQuote) {
      if (char === '$') {
        if (inDollarQuote === null) {
          const match = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/)
          if (match) {
            inDollarQuote = match[0]
            current += inDollarQuote
            i += inDollarQuote.length - 1
            continue
          }
        } else {
          if (sql.startsWith(inDollarQuote, i)) {
            current += inDollarQuote
            i += inDollarQuote.length - 1
            inDollarQuote = null
            continue
          }
        }
      }
    }

    // Semicolon outside of quotes and comments marks end of statement
    if (char === ';' && !inSingleQuote && inDollarQuote === null) {
      const trimmed = current.trim()
      if (trimmed.length > 0) {
        statements.push(trimmed)
      }
      current = ''
    } else {
      current += char
    }
  }

  const remaining = current.trim()
  if (remaining.length > 0) {
    statements.push(remaining)
  }

  return statements
}
