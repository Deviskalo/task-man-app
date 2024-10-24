const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function initializeDatabase() {
  const db = await open({
    filename: './tasks.sqlite',
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      dueDate TEXT  // Added dueDate column
    )
  `)

  await db.close()
}

initializeDatabase().catch(console.error)
