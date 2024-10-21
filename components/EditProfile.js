import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

export default function EditProfile({ onClose }) {
    const { data: session, update } = useSession()
    const [name, setName] = useState(session?.user?.name || '')
    const [image, setImage] = useState(null)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch('/api/user/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            })

            if (response.ok) {
                const updatedUser = await response.json()
                await update({ ...session, user: { ...session.user, ...updatedUser } })
                onClose()
            } else {
                throw new Error('Failed to update profile')
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Profile</h3>
                    <form onSubmit={handleSubmit} className="mt-2 text-left">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                Name
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="avatar">
                                Avatar
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files[0])}
                            />
                        </div>
                        {session?.user?.image && (
                            <div className="mb-4">
                                <Image
                                    src={session.user.image}
                                    alt="Current Avatar"
                                    width={100}
                                    height={100}
                                    className="rounded-full mx-auto"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="submit"
                            >
                                Save Changes
                            </button>
                            <button
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="button"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
