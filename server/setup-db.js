require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')

async function setup() {
  // Step 1: connect to default 'postgres' db to create healthy_life
  const admin = new Client({
    host: 'localhost', port: 5432,
    user: 'postgres', password: '1234',
    database: 'postgres',
  })
  await admin.connect()
  const exists = await admin.query(
    `SELECT 1 FROM pg_database WHERE datname='healthy_life'`
  )
  if (exists.rowCount === 0) {
    await admin.query('CREATE DATABASE healthy_life')
    console.log('✅ Created database: healthy_life')
  } else {
    console.log('ℹ️  Database healthy_life already exists')
  }
  await admin.end()

  // Step 2: run schema in healthy_life
  const db = new Client({
    host: 'localhost', port: 5432,
    user: 'postgres', password: '1234',
    database: 'healthy_life',
  })
  await db.connect()
  const schema = fs.readFileSync('./schema.sql', 'utf8')
  await db.query(schema)
  console.log('✅ Schema applied')
  await db.end()

  console.log('\n🌿 Database ready. Start the server with: node server.js')
}

setup().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})