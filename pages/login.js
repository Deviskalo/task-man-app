import { useState } from 'react'
import { signIn } from "next-auth/react"
import { useRouter } from 'next/router'
import { toast } from 'react-hot-toast'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            router.push('/')
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button type="submit">Log in</button>
        </form>
    )
}
