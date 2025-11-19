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
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { createApiClient } from "@scrubin/api-client";

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
    const { user } = useUser();
    const { id } = useParams<{ id: string }>();
    const apiClient = useMemo(
        () =>
            createApiClient({
                baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
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
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Failed to load requests");
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
                                Request coverage for a single day or a date range.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!newStartDate) return;
                                const start = newStartDate;
                                const end = newEndDate || newStartDate;
                                const startTime = new Date(start).getTime();
                                const endTime = new Date(end).getTime();
                                const normalized = startTime <= endTime ? { start, end } : { start: end, end: start };
                                const newReq: TimeOffReq = {
                                    id: `out-${Date.now()}`,
                                    kind: "timeoff",
                                    requestorId: 1,
                                    requestedUserId: 0,
                                    requestedApproval: "pending",
                                    managerApproval: null,
                                    requesterNames: ["You"],
                                    dateRange: normalized,
                                };
                                setOutgoing((prev) => [newReq, ...prev]);
                                setDialogOpen(false);
                                setNewStartDate("");
                                setNewEndDate("");
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Start date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={newStartDate}
                                    onChange={(e) => setNewStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">End date (optional)</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    min={newStartDate || undefined}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setDialogOpen(false);
                                        setNewStartDate("");
                                        setNewEndDate("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!newStartDate}>
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Tabs className="flex w-full justify-center items-center" defaultValue="incoming-requests">
                <TabsList>
                    <TabsTrigger className="p-4" value="incoming-requests">Incoming Requests</TabsTrigger>
                    <TabsTrigger className="p-4" value="outgoing-requests">Outgoing Requests</TabsTrigger>
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

            </Tabs>
        </main>
    );
}