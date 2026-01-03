'use client';
import React, { useCallback, useEffect, useMemo, use, useState } from 'react';
import AddShiftModal from '@/components/AddShiftModal';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';

import { getToday } from '../../../helpers/time';
import { Coffee, UsersRound } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import ShiftModal from '@/components/ShiftModal';
import SingleAddShiftModal from '@/components/SingleAddShiftModal';
import MonthlyCalendarCard from '@/components/schedule/MonthlyCalendarCard';
import {
  emptyWorkspaceMonthlySchedule,
  type DayKey,
  type Shift,
  type User,
  type WorkspaceMonthlySchedule
} from '@scrubin/schemas';

export default function AdminScheduleDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workspaceId = Number(id);
  const hasValidWorkspace = Number.isInteger(workspaceId);
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(getToday());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [monthSchedule, setMonthSchedule] = useState<WorkspaceMonthlySchedule>(
    emptyWorkspaceMonthlySchedule
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [openShiftDetails, setOpenShiftDeatils] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [openAddShift, setOpenAddShift] = useState<boolean>(false);

  const apiClient = useApiClient();

  const getUsers = useCallback(async () => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getWorkspaceMembers(id);
      setUsers(response.members ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users: ', error);
      setError('Could not load users');
    } finally {
      setIsLoading(false);
    }
  }, [hasValidWorkspace, id, apiClient]);

  const getMonthSchedule = useCallback(async () => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true);

      const monthStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
      // backend expects an exclusive end; use the start of the day *after* the last visible day
      const monthEndExclusive = addDays(
        startOfDay(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })),
        1
      );

      // API client throws error; start/end are required
      const data: WorkspaceMonthlySchedule = await apiClient.getWorkspaceShifts(id, {
        start: monthStart.toISOString(),
        end: monthEndExclusive.toISOString()
      });
      setMonthSchedule(data ?? emptyWorkspaceMonthlySchedule);
    } catch (error) {
      console.log(error);
      setError('Could not load shifts');
    } finally {
      setIsLoading(false);
    }
  }, [hasValidWorkspace, apiClient, currentMonth, id]);

  const handleDelete = async (shiftId: number) => {
    if (!confirm) return;

    try {
      setIsLoading(true);
      await apiClient.deleteShift(id, shiftId);
      //await handleShiftReload();
      setOpenShiftDeatils(false);
      setSelectedShift(null);
      setSelectedUser(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidWorkspace) return;
    getUsers();
  }, [hasValidWorkspace, getUsers]);

  useEffect(() => {
    if (!hasValidWorkspace) return;
    getMonthSchedule(); // refetch when workspace changes or month window moves
  }, [hasValidWorkspace, getMonthSchedule]);

  useSSEStream(workspaceId, {
    'shift-updated': () => {
      getMonthSchedule();
    }
  });

  const shiftCountByDayKey = useMemo(() => {
    const out: Record<DayKey, number> = {};
    for (const userId of Object.keys(monthSchedule.buckets ?? {})) {
      const byDay = monthSchedule.buckets[userId] ?? {};
      for (const [dayKey, items] of Object.entries(byDay)) {
        out[dayKey] = (out[dayKey] ?? 0) + (items?.length ?? 0);
      }
    }
    return out;
  }, [monthSchedule]);

  const selectedDayKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const scheduledEntries = useMemo(() => {
    return users
      .map((user) => ({
        user,
        shifts: monthSchedule?.buckets?.[user.id]?.[selectedDayKey] ?? []
      }))
      .filter((entry) => entry.shifts.length > 0);
  }, [users, monthSchedule, selectedDayKey]);

  const isSelectedDateInPast = isBefore(startOfDay(selectedDate), today);

  const calendarDayMeta = useMemo(() => {
    const out: Record<string, React.ReactNode> = {};
    for (const [dayKey, count] of Object.entries(shiftCountByDayKey)) {
      if (!count) continue;
      out[dayKey] = `${count} ${count === 1 ? 'shift scheduled' : 'shifts scheduled'}`;
    }
    return out;
  }, [shiftCountByDayKey]);

  return (
    <div className="mx-auto w-[90vw] max-w-none space-y-6 px-2 py-6 sm:px-4">
      {error && (
        <div>
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            Error: {error}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyCalendarCard
          className="lg:col-span-2"
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={setCurrentMonth}
          onToday={() => {
            const now = getToday();
            setCurrentMonth(now);
            setSelectedDate(startOfDay(now));
          }}
          isLoading={isLoading}
          dayMeta={calendarDayMeta}
          headerActions={
            <Button size="lg" onClick={() => setIsModal(true)}>
              Bulk assign shifts
            </Button>
          }
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              size="lg"
              disabled={isSelectedDateInPast}
              onClick={() => {
                if (isSelectedDateInPast) return;
                setSelectedUser(null);
                setSelectedDay(dayjs(selectedDate));
                setOpenAddShift(true);
              }}
            >
              Schedule on this date
            </Button>

            <div className="space-y-3">
              {scheduledEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No one is scheduled for this day.</p>
              ) : (
                scheduledEntries.map(({ user, shifts }) => (
                  <div key={user.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <UsersRound className="text-muted-foreground h-4 w-4" />
                      <div className="min-w-0 flex-1 truncate text-sm font-medium">
                        {user.firstName} {user.lastName ?? ''}
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      {shifts.map((shift) => (
                        <Button
                          key={shift.id}
                          variant="outline"
                          className="h-auto w-full items-start justify-start py-3"
                          onClick={() => {
                            setSelectedShift(shift);
                            setSelectedUser(user);
                            setOpenShiftDeatils(true);
                          }}
                        >
                          <div className="min-w-0 flex flex-1 flex-col gap-1 text-left">
                            <span className="text-sm font-medium">Manager</span>
                            <span className="text-xs whitespace-nowrap">
                              {format(parseISO(shift.startTime), 'HH:mm')} –{' '}
                              {format(parseISO(shift.endTime), 'HH:mm')}
                            </span>
                            {shift.breakDuration != null ? (
                              <div className="text-muted-foreground flex flex-row items-center gap-1 text-xs whitespace-nowrap">
                                <Coffee size={12} />
                                <span>{shift.breakDuration}min</span>
                              </div>
                            ) : null}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUser && selectedShift && (
        <ShiftModal
          shift={selectedShift}
          user={selectedUser}
          onDelete={handleDelete}
          workspaceId={workspaceId}
          isVisiable={openShiftDetails}
          setIsVisiable={setOpenShiftDeatils}
          users={users}
        />
      )}
      <SingleAddShiftModal
        open={openAddShift}
        setOpen={setOpenAddShift}
        user={selectedUser}
        selectedDay={selectedDay}
        users={users}
        workspaceId={workspaceId}
      />
      <AddShiftModal open={isModal} setOpen={setIsModal} users={users} workspaceId={Number(id)} />
    </div>
  );
}

