import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import EditProfile from '../components/EditProfile'

export default function Home() {
    const { data: session, status, update } = useSession()
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
    const [userName, setUserName] = useState(session?.user?.name || '')

    useEffect(() => {
        if (session?.user?.name) {
            setUserName(session.user.name)
        }
    }, [session])

    const handleProfileUpdate = useCallback(async (updatedUser) => {
        console.log("Updating session with:", updatedUser)
        await update({
            ...session,
            user: {
                ...session.user,
                name: updatedUser.name
            }
        })
        setUserName(updatedUser.name)
        // Force a session refresh
        const event = new Event("visibilitychange")
        document.dispatchEvent(event)
    }, [session, update])

    useEffect(() => {
        console.log("Current session:", session)
        console.log("Current userName:", userName)
    }, [session, userName])

    if (status === "loading") {
        return <p>Loading...</p>
    }

    if (status === "unauthenticated") {
        return <p>Access Denied</p>
    }

    return (
        <div>
            <h1>Welcome, {userName}</h1>
            <button onClick={() => setIsEditProfileOpen(true)}>Edit Profile</button>
            {isEditProfileOpen && (
                <EditProfile
                    onClose={() => setIsEditProfileOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
        </div>
    )
}
