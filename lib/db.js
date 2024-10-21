import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

let db = null

export async function openDb() {
    if (!db) {
        db = await open({
            filename: './mydb.sqlite',
            driver: sqlite3.Database
        })
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT
            )
        `)
        console.log("Database opened and table created if not exists")
    }
    return db
}
