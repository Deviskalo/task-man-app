import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { openDb } from '../../../lib/db'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const session = await getServerSession(req, res, authOptions)

    if (!session) {
        return res.status(401).json({ message: 'Not authenticated' })
    }

    const { name } = req.body

    try {
        const db = await openDb()
        await db.run(
            'UPDATE users SET name = ? WHERE email = ?',
            [name, session.user.email]
        )

        const updatedUser = await db.get(
            'SELECT * FROM users WHERE email = ?',
            [session.user.email]
        )

        console.log("Updated user in database:", updatedUser)

        res.status(200).json({ name: updatedUser.name })
    } catch (error) {
        console.error('Error updating user:', error)
        res.status(500).json({ message: 'Error updating user' })
    }
}
