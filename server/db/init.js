const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'todos.db');

// Initialize database
let db;

function initializeDatabase() {
  try {
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
    
    console.log(`✓ Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    console.error('✗ Failed to initialize database:', error.message);
    throw error;
  }
}

// Query function for executing SQL
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = stmt.run(...params);
      return { lastId: result.lastInsertRowid, changes: result.changes };
    } else {
      return stmt.run(...params);
    }
  } catch (error) {
    console.error('✗ Query failed:', error.message);
    throw error;
  }
}

// Get database connection
function getDatabase() {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

// Close database connection
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

// Initialize on module load
if (!db) {
  initializeDatabase();
}

module.exports = {
  query,
  getDatabase,
  closeDatabase,
};
