"use client";
import { useState, useEffect } from "react";
import { format, parseISO, isToday } from "date-fns";
import { Coffee, Play, Square, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useApiClient } from "@/hooks/useApiClient";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import type { Shift } from "@scrubin/schemas";

function ShiftTradeDialog({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Find Cover / Trade Shift</DialogTitle>
                    <DialogDescription>
                        Request a shift trade or find cover for your shift.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Shift trade functionality coming soon...
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function ClockinCard() {
    const { userId } = useAuth();
    const { id } = useParams<{ id: string }>();
    const workspaceId = id ? Number(id) : null;
    const apiClient = useApiClient();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [coworkers, setCoworkers] = useState<Array<{ id: string; firstName: string | null; lastName: string | null }>>([]);
    
    // Determine status from shift and timesheet data
    const getStatus = (): "scheduled" | "active" | "break" | "completed" => {
        if (!currentShift || !currentShift.timesheet) return "scheduled";
        
        const { timesheet } = currentShift;
        if (timesheet.clockOutTime) return "completed";
        if (timesheet.startBreakTime && !timesheet.endBreakTime) return "break";
        if (timesheet.clockInTime) return "active";
        return "scheduled";
    };
    
    const status = getStatus();
    
    const scheduledStart = currentShift ? parseISO(currentShift.startTime) : null;
    const scheduledEnd = currentShift ? parseISO(currentShift.endTime) : null;
    const clockInTime = currentShift?.timesheet?.clockInTime ? parseISO(currentShift.timesheet.clockInTime) : null;
    const clockOutTime = currentShift?.timesheet?.clockOutTime ? parseISO(currentShift.timesheet.clockOutTime) : null;
    const breakStartTime = currentShift?.timesheet?.startBreakTime ? parseISO(currentShift.timesheet.startBreakTime) : null;
    // const breakEndTime = currentShift?.timesheet?.endBreakTime ? parseISO(currentShift.timesheet.endBreakTime) : null;

    // Fetch coworkers working during overlapping shift times
   

    // Refresh shift data after API calls
    const refreshShift = async () => {
        if (!userId || !workspaceId || !currentShift) return;
        
        try {
            const response = await apiClient.getUserShifts(workspaceId!, userId, {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }) as { shifts: Shift[] };
            
            const updatedShift = response.shifts.find(s => s.id === currentShift.id);
            
            // If shift was clocked out, clear it from the card
            if (updatedShift?.timesheet?.clockOutTime) {
                setCurrentShift(null);
                return;
            }
            
            if (updatedShift) {
                setCurrentShift(updatedShift);
            }
        } catch (err) {
            console.error("Error refreshing shift:", err);
        }
    };

    const handleClockIn = async () => {
        if (!currentShift || !workspaceId) return;
        
        try {
            await apiClient.clockIn(workspaceId, currentShift.id, new Date().toISOString());
            await refreshShift();
        } catch (err) {
            console.error("Error clocking in:", err);
            setError("Failed to clock in");
        }
    };

    const handleClockOut = async () => {
        if (!currentShift || !workspaceId) return;
        
        try {
            await apiClient.clockOut(workspaceId, currentShift.id, new Date().toISOString());
            await refreshShift();
        } catch (err) {
            console.error("Error clocking out:", err);
            setError("Failed to clock out");
        }
    };

    const handleStartBreak = async () => {
        if (!currentShift || !workspaceId) return;
        
        try {
            await apiClient.startBreak(workspaceId, currentShift.id, new Date().toISOString());
            await refreshShift();
        } catch (err) {
            console.error("Error starting break:", err);
            setError("Failed to start break");
        }
    };

    const handleEndBreak = async () => {
        if (!currentShift || !workspaceId) return;
        
        try {
            await apiClient.endBreak(workspaceId, currentShift.id, new Date().toISOString());
            await refreshShift();
        } catch (err) {
            console.error("Error ending break:", err);
            setError("Failed to end break");
        }
    };

    // Fetch upcoming shift
    useEffect(() => {

        const fetchCoworkers = async (shift: Shift) => {
            if (!workspaceId || !userId) return;
            
            try {
                const shiftStart = parseISO(shift.startTime);
                const shiftEnd = parseISO(shift.endTime);
                
                // Fetch all shifts in the workspace during this time period
                // Expand the range slightly to catch overlapping shifts
                const searchStart = new Date(shiftStart);
                searchStart.setHours(0, 0, 0, 0);
                const searchEnd = new Date(shiftEnd);
                searchEnd.setHours(23, 59, 59, 999);
                
                const response = await apiClient.getWorkspaceShifts(workspaceId, {
                    start: searchStart.toISOString(),
                    end: searchEnd.toISOString(),
                }) as {
                    days: string[];
                    users: Array<{ id: string; firstName: string | null; lastName: string | null }>;
                    buckets: Record<string, Record<string, Array<{ id: number; startTime: string; endTime: string }>>>;
                };
                
                // Extract shifts that overlap with the current shift
                const overlappingUserIds = new Set<string>();
                
                // Create a map of userId (from buckets) to user id (from users array)
                // The buckets use userId (string) as keys, but we need to match with user.id
                const userIdToUserMap = new Map<string, string>();
                response.users.forEach(user => {
                    // The buckets key is the userId from the shift, which matches user.id
                    userIdToUserMap.set(user.id, user.id);
                });
                
                // Iterate through buckets to find overlapping shifts
                for (const userIdKey in response.buckets) {
                    // Skip the current user
                    if (userIdKey === userId) continue;
                    
                    const userBuckets = response.buckets[userIdKey];
                    for (const day in userBuckets) {
                        const dayShifts = userBuckets[day];
                        for (const s of dayShifts) {
                            const sStart = parseISO(s.startTime);
                            const sEnd = parseISO(s.endTime);
                            
                            // Check if shifts overlap: shift1 starts before shift2 ends AND shift1 ends after shift2 starts
                            if (sStart < shiftEnd && sEnd > shiftStart) {
                                // userIdKey is the userId from the shift, which should match user.id
                                overlappingUserIds.add(userIdKey);
                                break; // Found overlap, no need to check more shifts for this user
                            }
                        }
                    }
                }
                
                // Get user details for overlapping users
                const coworkerUsers = response.users.filter(user => overlappingUserIds.has(user.id));
                setCoworkers(coworkerUsers);
            } catch (err) {
                console.error("Error fetching coworkers:", err);
                // Don't set error state for coworkers, just log it
            }
        };

        if (!userId || !workspaceId) return;
        
        let alive = true;
        
        async function fetchUpcomingShift() {
            try {
                setLoading(true);
                setError(null);
                
                const now = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 7); // Look ahead 7 days
                
                const response = await apiClient.getUserShifts(workspaceId!, userId, {
                    start: now.toISOString(),
                    end: endDate.toISOString(),
                }) as { shifts: Shift[] };
                
                if (!alive) return;
                
                // Filter out shifts that have been clocked out (completed)
                const activeShifts = response.shifts.filter(s => {
                    // Exclude shifts that have a timesheet with clockOutTime set
                    return !s.timesheet || !s.timesheet.clockOutTime;
                });
                
                let shift = activeShifts[0]
                
                setCurrentShift(shift || null);
                
                // Fetch coworkers working during the same shift time
                if (shift) {
                    await fetchCoworkers(shift);
                }
            } catch (err) {
                if (!alive) return;
                setError(err instanceof Error ? err.message : "Failed to load shift");
                console.error("Error fetching upcoming shift:", err);
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        }
        
        fetchUpcomingShift();
        
        return () => {
            alive = false;
        };
    }, [userId, workspaceId, apiClient]);

    

    return (
        <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-medium">Current Shift</CardTitle>
                        {status === "active" && (
                            <Badge variant="outline" className="bg-red-500/15 text-red-500 border-red-500/20 animate-pulse">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Live
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        {loading ? (
                            "Loading shift..."
                        ) : error ? (
                            <span className="text-destructive">{error}</span>
                        ) : !currentShift ? (
                            "No upcoming shift scheduled"
                        ) : status === "scheduled" && scheduledStart && scheduledEnd ? (
                            `${isToday(scheduledStart) ? "Today" : format(scheduledStart, "EEE, MMM d")}, ${format(scheduledStart, "h:mm a")} - ${format(scheduledEnd, "h:mm a")}`
                        ) : status === "active" ? (
                            "Shift in progress"
                        ) : status === "break" ? (
                            "Break in progress"
                        ) : (
                            "Shift completed"
                        )}
                    </CardDescription>
                </div>
                <Badge
                    variant={status === "active" ? "default" : status === "break" ? "secondary" : "outline"}
                    className={`px-3 py-1 text-xs font-medium ${
                        status === "active" ? "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20" : ""
                    } ${status === "break" ? "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20" : ""}`}
                >
                    {status === "scheduled" && "Upcoming"}
                    {status === "active" && "Active"}
                    {status === "break" && "On Break"}
                    {status === "completed" && "Completed"}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !currentShift ? (
                    <div className="text-center py-8 text-muted-foreground">No upcoming shift scheduled</div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="flex flex-col items-center md:items-start space-y-1">
                                <span className="text-sm text-muted-foreground">
                                    {status === "scheduled" ? "Starts at" : status === "break" ? "Break Started" : "Clocked In"}
                                </span>
                                <div className="text-4xl font-bold tracking-tighter">
                                    {status === "scheduled" && scheduledStart
                                        ? format(scheduledStart, "h:mm a")
                                        : status === "break" && breakStartTime
                                            ? format(breakStartTime, "h:mm a")
                                            : clockInTime
                                                ? format(clockInTime, "h:mm a")
                                                : scheduledStart
                                                    ? format(scheduledStart, "h:mm a")
                                                    : "--"}
                                </div>
                            </div>

                            {status !== "completed" && coworkers.length > 0 && (
                                <div className="flex flex-col items-center md:items-end space-y-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Working with
                                    </span>
                                    <div className="flex -space-x-2">
                                        {coworkers.slice(0, 5).map((coworker) => {
                                            const initials = `${coworker.firstName?.[0] || ''}${coworker.lastName?.[0] || ''}`.toUpperCase() || '?';
                                            const name = `${coworker.firstName || ''} ${coworker.lastName || ''}`.trim() || 'Unknown';
                                            return (
                                                <Avatar key={coworker.id} className="border-2 border-background w-8 h-8" title={name}>
                                                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                                </Avatar>
                                            );
                                        })}
                                        {coworkers.length > 5 && (
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                                                +{coworkers.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {currentShift && (
                    <div className="grid grid-cols-2 gap-4">
                        {status === "scheduled" && (
                            <Button 
                                className="w-full h-12" 
                                onClick={handleClockIn}
                                disabled={!currentShift}
                            >
                                <Play className="mr-2 h-4 w-4" /> Clock In
                            </Button>
                        )}

                        {status === "active" && (
                            <>
                                <Button 
                                    variant="secondary" 
                                    className="w-full h-12 text-base" 
                                    onClick={handleStartBreak}
                                    disabled={!currentShift}
                                >
                                    <Coffee className="mr-2 h-4 w-4" /> Start Break
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    className="w-full h-12 text-base" 
                                    onClick={handleClockOut}
                                    disabled={!currentShift}
                                >
                                    <Square className="mr-2 h-4 w-4 fill-current" /> Clock Out
                                </Button>
                            </>
                        )}

                        {status === "break" && (
                            <Button 
                                className="w-full col-span-2 h-12 text-base" 
                                onClick={handleEndBreak}
                                disabled={!currentShift}
                            >
                                <Play className="mr-2 h-4 w-4" /> End Break & Resume
                            </Button>
                        )}

                        {status === "completed" && clockOutTime && (
                            <Button variant="outline" className="w-full col-span-2 h-12 text-base" disabled>
                                Shift Ended at {format(clockOutTime, "h:mm a")}
                            </Button>
                        )}

                        {/* Find Cover / Trade Button - Only visible when not clocked in or active */}
                        {status === "scheduled" && (
                            <ShiftTradeDialog>
                                <Button variant="outline" className="w-full h-12 text-base border-dashed">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Find Cover / Trade
                                </Button>
                            </ShiftTradeDialog>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

