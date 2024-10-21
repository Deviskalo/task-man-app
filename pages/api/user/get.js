import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { openDb } from '../../../lib/db'

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions)
    console.log("Session in get user API:", session)

    if (!session) {
        return res.status(401).json({ message: 'Not authenticated' })
    }

    try {
        const db = await openDb()
        const user = await db.get('SELECT * FROM users WHERE email = ?', [session.user.email])
        console.log("User from database:", user)

        if (user) {
            res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } })
        } else {
            res.status(404).json({ message: 'User not found' })
        }
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Error fetching user' })
    }
}
