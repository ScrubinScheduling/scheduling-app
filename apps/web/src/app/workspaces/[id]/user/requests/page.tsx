"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { createApiClient } from "@scrubin/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function MeetingRequests({ workspaceId }: { workspaceId: string }) {
    const { getToken } = useAuth();
    const apiClient = useMemo(
        () =>
            createApiClient({
                baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
                getToken,
            }),
        [getToken]
    );

    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load meetings
    useEffect(() => {
        if (!workspaceId) return;
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const result = await apiClient.getMeetingsByWorkspace(workspaceId);
                if (!alive) return;
                setMeetings(result.meetings ?? []);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setError(err instanceof Error ? err.message : "Failed to load meetings");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [workspaceId, apiClient]);

    // Handle voting
    const handleVote = async (meetingId: number, response: "YES" | "NO") => {
        try {
            await apiClient.respondToMeeting(workspaceId, meetingId, { response });
            toast.success("Vote recorded");
            const refreshed = await apiClient.getMeetingsByWorkspace(workspaceId);
            setMeetings(refreshed.meetings ?? []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to record vote");
        }
    };

    if (loading) {
        return (
        <div className="w-1/2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                <Skeleton className="h-5 w-1/3 bg-zinc-800" />
                <Skeleton className="h-3 w-2/3 bg-zinc-800" />
                <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                <div className="flex gap-2 mt-3">
                    <Skeleton className="h-8 w-20 bg-zinc-800" />
                    <Skeleton className="h-8 w-20 bg-zinc-800" />
                </div>
            </Card>
            ))}
        </div>
        );
    }

    if (error)
        return (
        <div className="text-red-400 bg-red-950 border border-red-800 rounded-md p-4 text-sm">
            Error: {error}
        </div>
        );

    if (meetings.length === 0)
        return <p className="text-gray-500 text-sm">No meeting requests yet.</p>;

    // 🔸 Render the meeting list
    return (
        <div className="w-1/2 space-y-4">
        {meetings.map((m) => (
            <Card
            key={m.id}
            className="bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
            <CardHeader className="flex justify-between items-start">
                <CardTitle className="text-white font-medium">{m.description}</CardTitle>
                <Badge>{m.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-400">
                <p>
                <span className="font-medium text-gray-200">Location:</span> {m.location}
                </p>
                <p>
                <span className="font-medium text-gray-200">Scheduled:</span> {m.date} – {m.time}
                </p>
                <div className="flex gap-2 pt-3">
                <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVote(m.id, "YES")}
                >
                    ✓ Yes
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleVote(m.id, "NO")}
                >
                    ✕ No
                </Button>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    );
}

export default function Page() {
    type DecisionStatus = "pending" | "approved" | "denied";
    type BaseReq = {
        id: string;
        requestorId: number;
        requestedUserId: number;
        requestedApproval: DecisionStatus;
        managerApproval: DecisionStatus | null;
    };
    type TradeReq = BaseReq & {
        kind: "trade";
        from: { name: string; date: string; start: string; end: string };
        to: { name: string; date: string; start: string; end: string };
    };
    type TimeOffReq = BaseReq & {
        kind: "timeoff";
        requesterNames: string[];
        dateRange: { start: string; end: string };
    };
    type AnyRequest = TradeReq | TimeOffReq;

    const { getToken } = useAuth();
    const { id } = useParams<{ id: string }>();
    const apiClient = useMemo(
        () =>
            createApiClient({
                baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
                getToken,
            }),
        [getToken]
    );

    const [incoming, setIncoming] = useState<AnyRequest[]>([]);
    const [outgoing, setOutgoing] = useState<AnyRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newStartDate, setNewStartDate] = useState<string>("");
    const [newEndDate, setNewEndDate] = useState<string>("");
    const [requestType, setRequestType] = useState<'trade' | 'cover'>('cover');
    const [selectedShiftId, setSelectedShiftId] = useState('');
    const [requestedShiftId, setRequestedShiftId] = useState('');
    const [requestedUserId, setRequestedUserId] = useState('');
    const [userShifts, setUserShifts] = useState<any[]>([]);
    const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
    const [allWorkspaceShifts, setAllWorkspaceShifts] = useState<any[]>([]);
    const { userId } = useAuth();
    function badge(status: DecisionStatus) {
        if (status === "approved") return <Badge variant="secondary">Approved</Badge>;
        if (status === "denied") return <Badge variant="destructive">Denied</Badge>;
        return <Badge variant="outline">Pending</Badge>;
    }

    useEffect(() => {
        if (!userId) return;  // Guard clause
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const [incomingRes, outgoingRes] = await Promise.all([
                    apiClient.getIncomingShiftRequestsByUser(id, userId),
                    apiClient.getOutgoingShiftRequestsByUser(id, userId),
                ]);
                if (!alive) return;
                setIncoming((incomingRes?.requests ?? []) as AnyRequest[]);
                setOutgoing((outgoingRes?.requests ?? []) as AnyRequest[]);
            } catch (err) {
                if (!alive) return;
                setError(err instanceof Error ? err.message : "Failed to load requests");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [id, apiClient, userId]);

    async function approve(idStr: string) {
        await apiClient.approveShiftRequest(id, idStr);
        setIncoming((prev) =>
            prev.map((r) =>
                r.id === idStr ? { ...r, requestedApproval: "approved", managerApproval: r.managerApproval ?? "pending" } : r
            )
        );
    }
    async function reject(idStr: string) {
        await apiClient.rejectShiftRequest(id, idStr);
        setIncoming((prev) =>
            prev.map((r) => (r.id === idStr ? { ...r, requestedApproval: "denied" } : r))
        );
    }

    return (
        <main className="mt-4">
            <div className="w-full flex justify-end px-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger asChild>
    <Button className="flex items-center gap-2 text-white" onClick={() => setDialogOpen(true)}>
      <Plus />
      New Request
    </Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create a shift request</DialogTitle>
      <DialogDescription>
        Request a shift trade or coverage from a teammate.
      </DialogDescription>
    </DialogHeader>

    {/* --- New Form --- */}
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          if (!selectedShiftId || (!requestedUserId && !requestedShiftId)) {
            throw new Error('Please fill in all fields.');
          }
          await apiClient.createShiftRequest(id, {
            lendedShiftId: Number(selectedShiftId),
            requestedShiftId: requestType === 'trade' ? Number(requestedShiftId) : null,
            requestedUserId: requestType === 'cover' ? requestedUserId : null,
          });

          setDialogOpen(false);
          setSelectedShiftId('');
          setRequestedShiftId('');
          setRequestedUserId('');
          setRequestType('cover');
            toast.success('Shift request created successfully.');
        } catch (err) {
          console.error(err);
          alert('Failed to create shift request. See console for details.');
        }
      }}
    >
      {/* Type: Cover vs Trade */}
      <div className="grid gap-2">
        <Label>Request Type</Label>
        <select
          className="border bg-background p-2 rounded-md"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value as 'trade' | 'cover')}
        >
          <option value="cover">Cover Request</option>
          <option value="trade">Trade Request</option>
        </select>
      </div>

      {/* Select Your Shift */}
      <div className="grid gap-2">
        <Label>Your Shift</Label>
        <select
          className="border bg-background p-2 rounded-md"
          value={selectedShiftId}
          onChange={(e) => setSelectedShiftId(e.target.value)}
          required
        >
          <option value="">Select your shift</option>
          {userShifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {new Date(shift.startTime).toLocaleString()} – {new Date(shift.endTime).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional render based on request type */}
      {requestType === 'cover' && (
        <div className="grid gap-2">
          <Label>Who should cover?</Label>
          <select
            className="border bg-background p-2 rounded-md"
            value={requestedUserId}
            onChange={(e) => setRequestedUserId(e.target.value)}
            required
          >
            <option value="">Select user</option>
            {workspaceUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {requestType === 'trade' && (
        <div className="grid gap-2">
          <Label>Shift to trade with</Label>
          <select
            className="border bg-background p-2 rounded-md"
            value={requestedShiftId}
            onChange={(e) => setRequestedShiftId(e.target.value)}
            required
          >
            <option value="">Select another shift</option>
            {allWorkspaceShifts
              .filter((s) => s.userId !== userId) // cannot trade with own shift
              .map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.user.firstName} {shift.user.lastName} —{' '}
                  {new Date(shift.startTime).toLocaleString()} to{' '}
                  {new Date(shift.endTime).toLocaleString()}
                </option>
              ))}
          </select>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDialogOpen(false);
            setRequestType('cover');
            setSelectedShiftId('');
            setRequestedShiftId('');
            setRequestedUserId('');
          }}
        >
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
            </div>
            <Tabs className="flex w-full justify-center items-center" defaultValue="incoming-requests">
                <TabsList>
                    <TabsTrigger className="p-4" value="incoming-requests">Incoming Requests</TabsTrigger>
                    <TabsTrigger className="p-4" value="outgoing-requests">Outgoing Requests</TabsTrigger>
                    <TabsTrigger className="p-4" value="meeting-requests">Meeting Requests</TabsTrigger>
                </TabsList>

                <TabsContent className="w-full flex justify-center" value="incoming-requests">

                    <div className="w-1/2 space-y-4">
                        {loading && <div className="text-sm text-gray-500">Loading…</div>}
                        {error && (
                            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                                Error: {error}
                            </div>
                        )}
                        {incoming.map((req) => (
                            <Card key={req.id} className="hover:bg-gray-50 hover:cursor-pointer">
                                <CardHeader className="flex items-center justify-between">
                                    <CardTitle className="font-semibold">
                                        {req.kind === "trade"
                                            ? `Shift Trade: ${req.from.name} ↔ ${req.to.name}`
                                            : `Cover Request: ${req.requesterNames.join(", ")}`}
                                    </CardTitle>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <span>You:</span>
                                            {badge(req.requestedApproval)}
                                        </div>
                                        {req.requestedApproval === "approved" && req.managerApproval && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span>Manager:</span>
                                                {badge(req.managerApproval)}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {req.kind === "trade" ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-md border p-3">
                                                <div className="text-sm font-medium">Giving</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {req.from.date} • {req.from.start}-{req.from.end}
                                                </div>
                                            </div>
                                            <div className="rounded-md border p-3">
                                                <div className="text-sm font-medium">Taking</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {req.to.date} • {req.to.start}-{req.to.end}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border p-3">
                                            <div className="text-sm font-medium">Shift</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(req.dateRange.start).toLocaleDateString()} • {new Date(req.dateRange.end).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => approve(req.id)}
                                            disabled={req.requestedApproval !== "pending"}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => reject(req.id)}
                                            disabled={req.requestedApproval !== "pending"}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent className="w-full flex justify-center" value="outgoing-requests">
                    <div className="w-1/2 space-y-4">
                        {outgoing.map((req) => (
                            <Card key={req.id} className="hover:bg-gray-50 hover:cursor-pointer">
                                <CardHeader className="flex items-center justify-between">
                                    <CardTitle className="font-semibold">
                                        {req.kind === "trade"
                                            ? `Shift Trade: ${req.from.name} ↔ ${req.to.name}`
                                            : `Cover Request: ${req.requesterNames.join(", ")}`}
                                    </CardTitle>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <span>You:</span>
                                            {badge(req.requestedApproval)}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <span>Manager:</span>
                                            {req.managerApproval ? badge(req.managerApproval) : <Badge variant="outline">Pending</Badge>}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {req.kind === "trade" ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-md border p-3">
                                                <div className="text-sm font-medium">Giving</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {req.from.date} • {req.from.start}-{req.from.end}
                                                </div>
                                            </div>
                                            <div className="rounded-md border p-3">
                                                <div className="text-sm font-medium">Taking</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {req.to.date} • {req.to.start}-{req.to.end}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border p-3">
                                            <div className="text-sm font-medium">Shift</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(req.dateRange.start).toLocaleDateString()} • {new Date(req.dateRange.end).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent className="w-full flex justify-center" value="meeting-requests">
                    <MeetingRequests workspaceId={id} />
                </TabsContent>

            </Tabs>
        </main>
    );
}