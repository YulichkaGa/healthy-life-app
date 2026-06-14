const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

const db = new Database(path.join(dataDir, 'healthy_life.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Convert pg-style $1,$2 placeholders to SQLite ?
function pgToSqlite(sql) {
  return sql.replace(/\$\d+/g, '?')
}

function query(text, params = []) {
  const sql = pgToSqlite(text)
  try {
    const stmt = db.prepare(sql)
    const upper = sql.trim().toUpperCase()
    if (upper.startsWith('SELECT') || upper.includes('RETURNING')) {
      return Promise.resolve({ rows: stmt.all(...params) })
    }
    const result = stmt.run(...params)
    return Promise.resolve({ rows: [], rowCount: result.changes, lastID: result.lastInsertRowid })
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = { query, db }