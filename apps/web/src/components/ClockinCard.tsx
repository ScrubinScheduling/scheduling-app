'use client';
import { useState, useEffect } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { Coffee, Play, Square, RefreshCw, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { Shift } from '@scrubin/schemas';
import type { WorkspaceMonthlySchedule } from '@scrubin/schemas';

function ShiftTradeDialog({
  children,
  currentShift
}: {
  children: React.ReactNode;
  currentShift: Shift | null;
}) {
  const { userId } = useAuth();
  const { id } = useParams<{ id: string }>();
  const apiClient = useApiClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<'trade' | 'cover'>('cover');
  const [requestedShiftId, setRequestedShiftId] = useState('');
  const [requestedUserId, setRequestedUserId] = useState('');
  const [workspaceUsers, setWorkspaceUsers] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [allWorkspaceShifts, setAllWorkspaceShifts] = useState<
    {
      id: number;
      startTime: string;
      endTime: string;
      userId: string;
      user?: { firstName?: string | null; lastName?: string | null };
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Load workspace data when dialog opens
  useEffect(() => {
    if (!dialogOpen || !userId) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const [membersRes, workspaceShiftsRes] = await Promise.all([
          apiClient.getWorkspaceMembers(Number(id)),
          apiClient.getWorkspaceShifts(Number(id), {
            start: now.toISOString(),
            end: futureDate.toISOString()
          })
        ]);

        if (!alive) return;

        // Flatten and deduplicate shifts
        const allShiftsRaw = Object.values(workspaceShiftsRes.buckets ?? {}).flatMap(
          (userBuckets) =>
            Array.isArray(userBuckets) ? userBuckets : Object.values(userBuckets ?? {}).flat()
        );

        const uniqueShiftsMap = new Map();
        allShiftsRaw.forEach((shift) => {
          uniqueShiftsMap.set(shift.id, shift);
        });
        const allShifts = Array.from(uniqueShiftsMap.values());

        setWorkspaceUsers(membersRes.members);
        setAllWorkspaceShifts(allShifts);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
        toast.error('Failed to load workspace data');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dialogOpen, userId, id, apiClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentShift) {
      toast.error('No shift selected');
      return;
    }

    try {
      if (!requestedUserId && !requestedShiftId) {
        toast.error('Please fill in all fields.');
        return;
      }

      await apiClient.createShiftRequest(id, {
        lendedShiftId: currentShift.id,
        requestedShiftId: requestType === 'trade' ? Number(requestedShiftId) : null,
        requestedUserId: requestType === 'cover' ? requestedUserId : null
      });

      setDialogOpen(false);
      setRequestedShiftId('');
      setRequestedUserId('');
      setRequestType('cover');
      toast.success('Shift request created successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create shift request.');
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border flex h-[350px] flex-col">
        <DialogHeader>
          <DialogTitle>Find Cover / Trade Shift</DialogTitle>
          <DialogDescription>Request a shift trade or find cover for your shift.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : (
          <form className="flex flex-1 flex-col space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>Request Type</Label>
              <select
                className="bg-background border-border w-full rounded-md border p-2"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as 'trade' | 'cover')}
              >
                <option value="cover">Cover Request</option>
                <option value="trade">Trade Request</option>
              </select>
            </div>

            <div className="min-h-[88px]">
              {requestType === 'cover' && (
                <div className="grid gap-2">
                  <Label>Who should cover?</Label>
                  <select
                    className="bg-background border-border w-full rounded-md border p-2"
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
                    className="bg-background border-border w-full rounded-md border p-2"
                    value={requestedShiftId}
                    onChange={(e) => setRequestedShiftId(e.target.value)}
                    required
                  >
                    <option value="">Select another shift</option>
                    {allWorkspaceShifts
                      .filter((s) => s.userId !== userId && s.id !== currentShift?.id)
                      .map((shift) => {
                        const userName = shift.user
                          ? `${shift.user.firstName || ''} ${shift.user.lastName || ''}`.trim() ||
                            'Unknown User'
                          : 'Unknown User';

                        return (
                          <option key={shift.id} value={shift.id}>
                            {userName} — {new Date(shift.startTime).toLocaleString()} to{' '}
                            {new Date(shift.endTime).toLocaleString()}
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}
            </div>

            <DialogFooter className="mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setRequestType('cover');
                  setRequestedShiftId('');
                  setRequestedUserId('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Request</Button>
            </DialogFooter>
          </form>
        )}
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
  const [coworkers, setCoworkers] = useState<WorkspaceMonthlySchedule['users']>([]);

  // Determine status from shift and timesheet data
  const getStatus = (): 'scheduled' | 'active' | 'break' | 'completed' => {
    if (!currentShift || !currentShift.timesheet) return 'scheduled';

    const { timesheet } = currentShift;
    if (timesheet.clockOutTime) return 'completed';
    if (timesheet.startBreakTime && !timesheet.endBreakTime) return 'break';
    if (timesheet.clockInTime) return 'active';
    return 'scheduled';
  };

  const status = getStatus();

  const scheduledStart = currentShift ? parseISO(currentShift.startTime) : null;
  const scheduledEnd = currentShift ? parseISO(currentShift.endTime) : null;
  const clockInTime = currentShift?.timesheet?.clockInTime
    ? parseISO(currentShift.timesheet.clockInTime)
    : null;
  const clockOutTime = currentShift?.timesheet?.clockOutTime
    ? parseISO(currentShift.timesheet.clockOutTime)
    : null;
  const breakStartTime = currentShift?.timesheet?.startBreakTime
    ? parseISO(currentShift.timesheet.startBreakTime)
    : null;

  // Refresh shift data after API calls
  const refreshShift = async () => {
    if (!userId || !workspaceId || !currentShift) return;

    try {
      const response = (await apiClient.getUserShifts(workspaceId!, userId, {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })) as { shifts: Shift[] };

      const updatedShift = response.shifts.find((s) => s.id === currentShift.id);

      // If shift was clocked out, clear it from the card
      if (updatedShift?.timesheet?.clockOutTime) {
        setCurrentShift(null);
        return;
      }

      if (updatedShift) {
        setCurrentShift(updatedShift);
      }
    } catch (err) {
      console.error('Error refreshing shift:', err);
    }
  };

  const handleClockIn = async () => {
    if (!currentShift || !workspaceId) return;

    try {
      await apiClient.clockIn(workspaceId, currentShift.id, new Date().toISOString());
      await refreshShift();
    } catch (err) {
      console.error('Error clocking in:', err);
      setError('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!currentShift || !workspaceId) return;

    try {
      await apiClient.clockOut(workspaceId, currentShift.id, new Date().toISOString());
      await refreshShift();
    } catch (err) {
      console.error('Error clocking out:', err);
      setError('Failed to clock out');
    }
  };

  const handleStartBreak = async () => {
    if (!currentShift || !workspaceId) return;

    try {
      await apiClient.startBreak(workspaceId, currentShift.id, new Date().toISOString());
      await refreshShift();
    } catch (err) {
      console.error('Error starting break:', err);
      setError('Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    if (!currentShift || !workspaceId) return;

    try {
      await apiClient.endBreak(workspaceId, currentShift.id, new Date().toISOString());
      await refreshShift();
    } catch (err) {
      console.error('Error ending break:', err);
      setError('Failed to end break');
    }
  };

  // Fetch upcoming shift
  useEffect(() => {
    const fetchCoworkers = async (shift: Shift) => {
      if (!workspaceId || !userId) return;

      try {
        const shiftStart = parseISO(shift.startTime);
        const shiftEnd = parseISO(shift.endTime);

        const searchStart = new Date(shiftStart);
        searchStart.setHours(0, 0, 0, 0);
        const searchEnd = new Date(shiftEnd);
        searchEnd.setHours(23, 59, 59, 999);

        const response = (await apiClient.getWorkspaceShifts(workspaceId, {
          start: searchStart.toISOString(),
          end: searchEnd.toISOString()
        })) as WorkspaceMonthlySchedule;

        const overlappingUserIds = new Set<string>();

        for (const userIdKey in response.buckets) {
          if (userIdKey === userId) continue;

          const userBuckets = response.buckets[userIdKey];
          for (const day in userBuckets) {
            const dayShifts = userBuckets[day];
            for (const s of dayShifts) {
              const sStart = parseISO(s.startTime);
              const sEnd = parseISO(s.endTime);

              if (sStart < shiftEnd && sEnd > shiftStart) {
                overlappingUserIds.add(userIdKey);
                break;
              }
            }
          }
        }

        const coworkerUsers = response.users.filter((user) => overlappingUserIds.has(user.id));
        setCoworkers(coworkerUsers);
      } catch (err) {
        console.error('Error fetching coworkers:', err);
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
        endDate.setDate(endDate.getDate() + 7);

        const response = (await apiClient.getUserShifts(workspaceId!, userId, {
          start: now.toISOString(),
          end: endDate.toISOString()
        })) as { shifts: Shift[] };

        if (!alive) return;

        const activeShifts = response.shifts.filter((s) => {
          return !s.timesheet || !s.timesheet.clockOutTime;
        });

        const shift = activeShifts[0];

        setCurrentShift(shift || null);

        if (shift) {
          await fetchCoworkers(shift);
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load shift');
        console.error('Error fetching upcoming shift:', err);
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
            {status === 'active' && (
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary animate-pulse"
              >
                <span className="relative mr-1 flex h-2 w-2">
                  <span className="bg-primary/60 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                  <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
                </span>
                Live
              </Badge>
            )}
          </div>
          <CardDescription>
            {loading ? (
              'Loading shift...'
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : !currentShift ? (
              'No upcoming shift scheduled'
            ) : status === 'scheduled' && scheduledStart && scheduledEnd ? (
              `${isToday(scheduledStart) ? 'Today' : format(scheduledStart, 'EEE, MMM d')}, ${format(scheduledStart, 'h:mm a')} - ${format(scheduledEnd, 'h:mm a')}`
            ) : status === 'active' ? (
              'Shift in progress'
            ) : status === 'break' ? (
              'Break in progress'
            ) : (
              'Shift completed'
            )}
          </CardDescription>
        </div>
        <Badge
          variant={status === 'active' ? 'default' : status === 'break' ? 'secondary' : 'outline'}
          className="px-3 py-1 text-xs font-medium"
        >
          {status === 'scheduled' && 'Upcoming'}
          {status === 'active' && 'Active'}
          {status === 'break' && 'On Break'}
          {status === 'completed' && 'Completed'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {loading ? (
          <div className="text-muted-foreground py-8 text-center">Loading...</div>
        ) : !currentShift ? (
          <div className="text-muted-foreground py-8 text-center">No upcoming shift scheduled</div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-col items-center space-y-1 md:items-start">
                <span className="text-muted-foreground text-sm">
                  {status === 'scheduled'
                    ? 'Starts at'
                    : status === 'break'
                      ? 'Break Started'
                      : 'Clocked In'}
                </span>
                <div className="text-4xl font-bold tracking-tighter">
                  {status === 'scheduled' && scheduledStart
                    ? format(scheduledStart, 'h:mm a')
                    : status === 'break' && breakStartTime
                      ? format(breakStartTime, 'h:mm a')
                      : clockInTime
                        ? format(clockInTime, 'h:mm a')
                        : scheduledStart
                          ? format(scheduledStart, 'h:mm a')
                          : '--'}
                </div>
              </div>

              {status !== 'completed' && coworkers.length > 0 && (
                <div className="flex flex-col items-center space-y-2 md:items-end">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" /> Working with
                  </span>
                  <div className="flex -space-x-2">
                    {coworkers.slice(0, 5).map((coworker) => {
                      const initials =
                        `${coworker.firstName?.[0] || ''}${coworker.lastName?.[0] || ''}`.toUpperCase() ||
                        '?';
                      const name =
                        `${coworker.firstName || ''} ${coworker.lastName || ''}`.trim() ||
                        'Unknown';
                      return (
                        <Avatar
                          key={coworker.id}
                          className="border-background h-8 w-8 border-2"
                          title={name}
                        >
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {coworkers.length > 5 && (
                      <div className="border-background bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-medium">
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
            {status === 'scheduled' && (
              <Button className="h-12 w-full" onClick={handleClockIn} disabled={!currentShift}>
                <Play className="mr-2 h-4 w-4" /> Clock In
              </Button>
            )}

            {status === 'active' && (
              <>
                <Button
                  variant="secondary"
                  className="h-12 w-full text-base"
                  onClick={handleStartBreak}
                  disabled={!currentShift}
                >
                  <Coffee className="mr-2 h-4 w-4" /> Start Break
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 w-full text-base"
                  onClick={handleClockOut}
                  disabled={!currentShift}
                >
                  <Square className="mr-2 h-4 w-4 fill-current" /> Clock Out
                </Button>
              </>
            )}

            {status === 'break' && (
              <Button
                className="col-span-2 h-12 w-full text-base"
                onClick={handleEndBreak}
                disabled={!currentShift}
              >
                <Play className="mr-2 h-4 w-4" /> End Break & Resume
              </Button>
            )}

            {status === 'completed' && clockOutTime && (
              <Button variant="outline" className="col-span-2 h-12 w-full text-base" disabled>
                Shift Ended at {format(clockOutTime, 'h:mm a')}
              </Button>
            )}

            {/* Find Cover / Trade Button - Only visible when scheduled */}
            {status === 'scheduled' && (
              <ShiftTradeDialog currentShift={currentShift}>
                <Button variant="outline" className="h-12 w-full border-dashed text-base">
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
