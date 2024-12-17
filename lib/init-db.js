import { openDb } from './db'

async function initDatabase() {
    const db = await openDb()

    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `)

    console.log('Database initialized')
}

initDatabase().catch(console.error)
