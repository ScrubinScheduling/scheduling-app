'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function CreateShiftRequestPage() {
  const { getToken } = useAuth();

  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [lendedShiftId, setLendedShiftId] = useState<string>('');
  const [requestedShiftId, setRequestedShiftId] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Submitting...');

    try {
      // get a JWT for Clerk-authenticated requests
      const token = await getToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/shift-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            lendedShiftId: Number(lendedShiftId),
            requestedShiftId: requestedShiftId ? Number(requestedShiftId) : null
          })
        }
      );

      if (res.ok) {
        setMessage('Shift request created successfully!');
        setWorkspaceId('');
        setLendedShiftId('');
        setRequestedShiftId('');
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.message ?? 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="border-border bg-card text-foreground mx-auto mt-10 max-w-md rounded-lg border p-4">
      <h1 className="mb-4 text-xl font-semibold">Create Shift Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Workspace ID</label>
          <input
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            type="number"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Lended Shift ID</label>
          <input
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            type="number"
            value={lendedShiftId}
            onChange={(e) => setLendedShiftId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Requested Shift ID (optional)</label>
          <input
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            type="number"
            value={requestedShiftId}
            onChange={(e) => setRequestedShiftId(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
        >
          Submit
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
