import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export default function EditProfile({ onClose, onProfileUpdate }) {
    const { data: session } = useSession()
    const [name, setName] = useState(session?.user?.name || '')
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setIsUpdating(true)
        setError('')
        try {
            const response = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })

            if (response.ok) {
                const updatedUser = await response.json()
                console.log("Profile updated successfully:", updatedUser)
                await onProfileUpdate(updatedUser)
                onClose()
            } else {
                throw new Error('Failed to update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            setError('Failed to update profile. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }, [name, onProfileUpdate, onClose])

    return (
        <div>
            <h2>Edit Profile</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                />
                <button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
            <button onClick={onClose}>Close</button>
        </div>
    )
}
