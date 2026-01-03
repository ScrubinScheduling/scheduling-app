'use client';
import React, { useCallback, useEffect, useMemo, use, useState } from 'react';
import AddShiftModal from '@/components/AddShiftModal';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';

import { getToday } from '../../../helpers/time';
import { ChevronLeft, ChevronRight, Coffee, UsersRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import ShiftModal from '@/components/ShiftModal';
import SingleAddShiftModal from '@/components/SingleAddShiftModal';
import {
  emptyWorkspaceMonthlySchedule,
  type DayKey,
  type Shift,
  type User,
  type WorkspaceMonthlySchedule
} from '@scrubin/schemas';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) =>
  format(new Date(2020, monthIndex, 1), 'MMM')
);

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

  const calendarDays = useMemo(() => {
    const monthStartDate = startOfMonth(currentMonth);
    const monthEndDate = endOfMonth(currentMonth);
    const start = startOfWeek(monthStartDate, { weekStartsOn: 0 });
    const end = endOfWeek(monthEndDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1));

  const currentMonthIndex = currentMonth.getMonth();
  const currentYear = currentMonth.getFullYear();
  const yearOptions = useMemo(() => {
    const start = currentYear - 50;
    return Array.from({ length: 101 }, (_, i) => start + i);
  }, [currentYear]);

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
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const now = getToday();
                    setCurrentMonth(now);
                    setSelectedDate(startOfDay(now));
                  }}
                >
                  Today
                </Button>
                <Button size="lg" onClick={() => setIsModal(true)}>
                  Bulk assign shifts
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {isLoading && (
              <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
                <Spinner className="size-6" />
              </div>
            )}

            <div
              className={cn(
                isLoading && 'pointer-events-none opacity-50',
                'flex min-h-[800px] flex-col'
              )}
            >
              {/* Month navigation */}
              <div className="mb-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(currentMonthIndex)}
                    onValueChange={(value) => {
                      const nextMonthIndex = Number(value);
                      if (!Number.isInteger(nextMonthIndex)) return;
                      setCurrentMonth(startOfMonth(new Date(currentYear, nextMonthIndex, 1)));
                    }}
                  >
                    <SelectTrigger size="sm" aria-label="Select month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="center">
                      {MONTH_OPTIONS.map((label, monthIndex) => (
                        <SelectItem key={label} value={String(monthIndex)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(currentYear)}
                    onValueChange={(value) => {
                      const nextYear = Number(value);
                      if (!Number.isInteger(nextYear)) return;
                      setCurrentMonth(startOfMonth(new Date(nextYear, currentMonthIndex, 1)));
                    }}
                  >
                    <SelectTrigger size="sm" aria-label="Select year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="center">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Weekday headers */}
              <div className="mb-2 grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-muted-foreground py-2 text-center text-xs font-medium uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const count = shiftCountByDayKey[dayKey] ?? 0;
                  const isCurrentMonthDay = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'flex h-full flex-col items-start justify-start rounded-lg border p-3 text-left transition-colors',
                        'hover:bg-muted/50',
                        !isCurrentMonthDay && 'opacity-40',
                        isToday && 'border-primary border-2',
                        isSelected && 'ring-primary/40 ring-2'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isToday && 'text-primary font-bold'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {count > 0 && (
                        <span className="text-muted-foreground mt-1 text-xs">
                          {count} {count === 1 ? 'shift scheduled' : 'shifts scheduled'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

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

