'use client';
import { CardHeader, CardTitle, Card, CardContent } from '@/components/ui/card';
import { Button, DatePicker, Spin } from 'antd';
import { LoadingOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import React, { useState, useMemo, use, useEffect, useCallback } from 'react';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';
import { useAuth } from '@clerk/nextjs';
import dayjs from 'dayjs';
import type { Shift as ApiShift, WorkspaceMonthlySchedule } from '@scrubin/schemas';
import {
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
  startOfDay,
  addDays
} from 'date-fns';

type Shift = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  kind: 'shift';
};

type ApiTimeOffRequest = {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  requesterNames: string[];
  dateRange: {
    start: string;
    end: string;
  };
};

type TimeOffEvent = {
  id: string;
  date: string;
  startDate: string;
  endDate: string;
  requesterName: string;
  kind: 'timeoff';
};

type CoworkerEntry = {
  member: WorkspaceMonthlySchedule['users'][number];
  shifts: ApiShift[];
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const expandTimeOffRequests = (requests: ApiTimeOffRequest[]): TimeOffEvent[] => {
  const events: TimeOffEvent[] = [];

  for (const req of requests) {
    const requesterName = req.requesterNames[0] ?? 'Unkown';

    const rangeStart = new Date(req.dateRange.start);
    const rangeEnd = new Date(req.dateRange.end);

    let cursor = startOfDay(rangeStart);

    while (cursor <= rangeEnd) {
      events.push({
        id: req.id,
        date: format(cursor, 'yyyy-MM-dd'),
        startDate: req.dateRange.start,
        endDate: req.dateRange.end,
        requesterName,
        kind: 'timeoff'
      });

      cursor = addDays(cursor, 1);
    }
  }

  return events;
};

const mapApiShift = (shift: ApiShift): Shift => {
  const start = parseISO(shift.startTime);
  const end = parseISO(shift.endTime);

  return {
    id: shift.id,
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
    role: 'Shift',
    kind: 'shift'
  };
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const apiClient = useApiClient();
  const { id } = use(params);
  const workspaceId = Number(id);
  const { userId } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(currentDate);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [teamSchedule, setTeamSchedule] = useState<WorkspaceMonthlySchedule | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOffEvent[]>([]);
  // Todo: Add Error Checks const [err, setErr] = useState<string>('');

  const fetchShifts = useCallback(async () => {
    try {
      setIsloading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const data = await apiClient.getUserShifts(id, userId, {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      });

      const apiShifts: ApiShift[] = data.shifts ?? [];
      setShifts(apiShifts.map(mapApiShift));
    } catch (error) {
      console.log(error);
    } finally {
      setIsloading(false);
    }
  }, [apiClient, currentDate, id, userId]);

  const fetchTeamSchedule = useCallback(
    async (day: Date) => {
      const dayStart = startOfDay(day);
      const dayEnd = addDays(day, 1);

      const data = await apiClient.getWorkspaceShifts(id, {
        start: dayStart.toISOString(),
        end: dayEnd.toISOString()
      });

      setTeamSchedule(data);
    },
    [apiClient, id]
  );

  const fetchTimeOff = useCallback(async () => {
    try {
      // Todo: Implement time range for getting TimeOffRequests
      //const monthStart = startOfMonth(currentDate);
      //const monthEnd = endOfMonth(currentDate);

      const data = await apiClient.getTimeOffRequests(id, {
        status: 'approved'
      });

      const apiRequests: ApiTimeOffRequest[] = data.requests ?? [];
      const events = expandTimeOffRequests(apiRequests);
      setTimeOff(events);
    } catch (error) {
      console.log(error);
    }
  }, [apiClient, id]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchTeamSchedule(selectedDate);
  }, [selectedDate, fetchTeamSchedule]);

  useEffect(() => {
    if (!userId) return;
    fetchShifts();
    fetchTimeOff();
  }, [userId, fetchShifts, fetchTimeOff]);

  const getShiftsForDay = useCallback(
    (day: Date) => {
      const key = format(day, 'yyyy-MM-dd');
      return shifts.filter((s) => s.date === key);
    },
    [shifts]
  );

  const getTimeOffForDay = useCallback(
    (day: Date) => {
      const key = format(day, 'yyyy-MM-dd');
      return timeOff.filter((t) => t.date === key);
    },
    [timeOff]
  );

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return [];

    const shiftsForDay = getShiftsForDay(selectedDate);
    const timeOffForDay = getTimeOffForDay(selectedDate);

    return [...shiftsForDay, ...timeOffForDay];
  }, [selectedDate, getShiftsForDay, getTimeOffForDay]);

  const calendarDays = useMemo(() => {
    const startOfMonthDate = startOfMonth(currentDate);
    const endOfMonthDate = endOfMonth(currentDate);

    const start = startOfWeek(startOfMonthDate, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonthDate, { weekStartsOn: 0 });

    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const coworkerEntries = useMemo<CoworkerEntry[]>(() => {
    if (!teamSchedule || !selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return teamSchedule.users
      .filter((member) => String(member.id) !== userId)
      .map((member) => ({
        member,
        shifts: teamSchedule.buckets[member.id]?.[key] ?? []
      }))
      .filter((entry) => entry.shifts.length > 0);
  }, [teamSchedule, selectedDate, userId]);

  const previousMonth = () => setCurrentDate((d) => subMonths(d, 1));

  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));

  useSSEStream(workspaceId, {
    'shift-updated': () => {
      fetchShifts();
    }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 py-10 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex flex-row gap-4">
                <div className="flex flex-row gap-2">
                  <Button icon={<LeftOutlined />} onClick={previousMonth} />
                  <DatePicker
                    picker="month"
                    format="MMM"
                    value={dayjs(currentDate)}
                    onChange={(value) => {
                      if (!value) return;
                      // value is a dayjs; convert to Date
                      setCurrentDate(value.toDate());
                      setSelectedDate(null);
                    }}
                  />
                  <Button icon={<RightOutlined />} onClick={nextMonth} />
                </div>

                <Button
                  type="primary"
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDate(today);
                  }}
                >
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="mb-2 grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'].map((day) => (
              <div
                className="text-muted-foreground py-2 text-center text-xs font-medium uppercase"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 px-2">
            {calendarDays.map((day, index) => {
              const dayShifts = getShiftsForDay(day);
              const dayTimeOff = getTimeOffForDay(day);
              const isCurrentMonthDay = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <Button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  type="default"
                  style={{
                    minHeight: 100,
                    borderRadius: '0.5rem',
                    borderColor: isToday || isSelected ? 'var(--color-primary)' : undefined,
                    borderWidth: isToday ? 2 : 1,
                    textAlign: 'center',
                    opacity: !isCurrentMonthDay ? 0.4 : 1
                  }}
                >
                  <div className="flex h-full flex-1 flex-col items-center">
                    <span
                      className={cn(
                        'mb-2 pt-2 text-sm font-medium',
                        isToday && 'text-primary font-bold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="w-full space-y-1.5">
                      {dayShifts.map((shift) => (
                        <div key={shift.id} className="space-y-0.5">
                          <div className="text-foreground truncate text-[11px] font-medium">
                            {/* Where user role will go once implemented */}
                            <span>Manager</span>
                          </div>

                          <div className="text-muted-foreground text-[10px]">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </div>
                      ))}

                      {dayTimeOff.length > 0 && (
                        <div className="mt-1 inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-[10px] text-amber-900">Time off</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          {isLoading && <Spin spinning={isLoading} indicator={<LoadingOutlined />} />}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {selectedDate && selectedDayEntries.length > 0 ? (
              <div className="space-y-3">
                {selectedDayEntries.map((entry) => (
                  <div
                    key={`${entry.kind}-${entry.id}`}
                    className="bg-card space-y-2 rounded-lg border p-4"
                  >
                    {entry.kind === 'shift' ? (
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {entry.startTime} - {entry.endTime}
                        </span>
                        <span className="text-muted-foreground text-xs">Shift</span>
                      </div>
                    ) : (
                      // Time Off Card
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Time off – {entry.requesterName}</span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Time off
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {entry.startDate} – {entry.endDate}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No shifts scheduled for this day
              </p>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Click on a date to view shift details
              </p>
            )}

            <CardTitle className="text-lg">Scheduled:</CardTitle>

            <div>
              {coworkerEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No coworkers scheduled for this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {coworkerEntries.map(({ member, shifts }) => (
                    <div key={member.id} className="rounded-lg border p-3">
                      <div className="text-sm font-medium">
                        {member.firstName} {member.lastName ?? ''}
                      </div>
                      <div className="text-muted-foreground mt-1 space-y-1 text-xs">
                        {shifts.map((shift) => (
                          <div key={shift.id}>
                            {format(parseISO(shift.startTime), 'HH:mm')} –{' '}
                            {format(parseISO(shift.endTime), 'HH:mm')}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
