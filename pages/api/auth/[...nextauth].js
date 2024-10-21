import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "../../../lib/prisma"
import bcrypt from "bcrypt"
import { openDb } from '../../../lib/db'

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials.email || !credentials.password) {
                    throw new Error("Please enter an email and password");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("No user found with this email");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return { id: user.id, email: user.email, name: user.name };
            }
        })
    ],
    database: async () => {
        return openDb()
    },
    session: {
        jwt: true,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                // Fetch the latest user data from the database
                const db = await openDb()
                const user = await db.get('SELECT * FROM users WHERE id = ?', [token.id])
                if (user) {
                    session.user.name = user.name
                }
            }
            return session
        },
        async signIn({ user }) {
            const db = await openDb()
            const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [user.email])

            if (!existingUser) {
                // Create the user if they don't exist
                await db.run(
                    'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
                    [user.id, user.name, user.email]
                )
                console.log("New user created in database:", user)
            }

            return true
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
