'use client'
import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

export default function CreateShiftRequestPage() {
    const { getToken } = useAuth();

    const [workspaceId, setWorkspaceId] = useState<string>('')
    const [lendedShiftId, setLendedShiftId] = useState<string>('')
    const [requestedShiftId, setRequestedShiftId] = useState<string>('')
    const [message, setMessage] = useState<string>('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage('Submitting...')

        try {
            // get a JWT for Clerk-authenticated requests
            const token = await getToken()

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/shift-requests`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        lendedShiftId: Number(lendedShiftId),
                        requestedShiftId: requestedShiftId ? Number(requestedShiftId) : null,
                    }),
                }
            )

            if (res.ok) {
                setMessage('Shift request created successfully!')
                setWorkspaceId('')
                setLendedShiftId('')
                setRequestedShiftId('')
            } else {
                const data = await res.json()
                setMessage(`Error: ${data.message ?? 'Unknown error'}`)
            }
        } catch (error) {
            console.error(error)
            setMessage('Network error. Please try again later.')
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h1 className="text-xl font-semibold mb-4">Create Shift Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Workspace ID</label>
          <input
            className="w-full px-2 py-1 border rounded"
            type="number"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Lended Shift ID</label>
          <input
            className="w-full px-2 py-1 border rounded"
            type="number"
            value={lendedShiftId}
            onChange={(e) => setLendedShiftId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Requested Shift ID (optional)
          </label>
          <input
            className="w-full px-2 py-1 border rounded"
            type="number"
            value={requestedShiftId}
            onChange={(e) => setRequestedShiftId(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
    )
}