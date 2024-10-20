import prisma from '../../../lib/prisma'
import bcrypt from 'bcrypt'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { name, email, password } = req.body

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        res.status(201).json({ message: 'User created successfully' })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({ error: 'Something went wrong' })
    }
}
