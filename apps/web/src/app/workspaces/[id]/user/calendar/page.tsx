'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO, startOfDay } from 'date-fns';

import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';
import MonthlyCalendarCard from '@/components/schedule/MonthlyCalendarCard';
import DayScheduleCard from '@/components/schedule/DayScheduleCard';
import ShiftSummaryButton from '@/components/schedule/ShiftSummaryButton';
import { useAuth } from '@clerk/nextjs';
import type { DayKey, Shift, WorkspaceMonthlySchedule } from '@scrubin/schemas';

import { getVisibleMonthWindow } from '../../../../../../helpers/schedule';

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

const expandTimeOffRequests = (requests: ApiTimeOffRequest[]): TimeOffEvent[] => {
  const events: TimeOffEvent[] = [];

  for (const req of requests) {
    const requesterName = req.requesterNames[0] ?? 'Unknown';

    const rangeStart = startOfDay(new Date(req.dateRange.start));
    const rangeEnd = startOfDay(new Date(req.dateRange.end));

    let cursor = rangeStart;

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

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const apiClient = useApiClient();
  const { id } = use(params);
  const workspaceId = Number(id);
  const hasValidWorkspace = Number.isInteger(workspaceId);
  const { userId } = useAuth();

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teamSchedule, setTeamSchedule] = useState<WorkspaceMonthlySchedule | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOffEvent[]>([]);
  // Todo: Add Error Checks const [err, setErr] = useState<string>('');

  const fetchShifts = useCallback(async () => {
    try {
      if (!userId || !hasValidWorkspace) return;
      setIsLoading(true);

      const { start, endExclusive } = getVisibleMonthWindow(currentMonth, { weekStartsOn: 0 });
      const data = (await apiClient.getUserShifts(id, userId, {
        start: start.toISOString(),
        end: endExclusive.toISOString()
      })) as { shifts?: Shift[] };

      setShifts(data.shifts ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, currentMonth, hasValidWorkspace, id, userId]);

  const fetchTeamSchedule = useCallback(
    async (day: Date) => {
      if (!hasValidWorkspace) return;
      const dayStart = startOfDay(day);
      const dayEndExclusive = addDays(dayStart, 1);

      const data = await apiClient.getWorkspaceShifts(id, {
        start: dayStart.toISOString(),
        end: dayEndExclusive.toISOString()
      });

      setTeamSchedule(data);
    },
    [apiClient, hasValidWorkspace, id]
  );

  const fetchTimeOff = useCallback(async () => {
    try {
      if (!hasValidWorkspace) return;
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
  }, [apiClient, hasValidWorkspace, id]);

  useEffect(() => {
    fetchTeamSchedule(selectedDate);
  }, [selectedDate, fetchTeamSchedule]);

  useEffect(() => {
    if (!userId) return;
    fetchShifts();
    fetchTimeOff();
  }, [userId, fetchShifts, fetchTimeOff]);

  const selectedDayKey = useMemo<DayKey>(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const myShiftsForSelectedDay = useMemo(() => {
    return shifts.filter((shift) => format(parseISO(shift.startTime), 'yyyy-MM-dd') === selectedDayKey);
  }, [shifts, selectedDayKey]);

  const timeOffForSelectedDay = useMemo(() => {
    return timeOff.filter((t) => t.date === selectedDayKey);
  }, [timeOff, selectedDayKey]);

  const coworkerEntries = useMemo(() => {
    if (!teamSchedule || !userId) return [];

    return teamSchedule.users
      .filter((member) => member.id !== userId)
      .map((member) => ({
        user: member,
        shifts: teamSchedule.buckets[member.id]?.[selectedDayKey] ?? []
      }))
      .filter((entry) => entry.shifts.length > 0);
  }, [teamSchedule, selectedDayKey, userId]);

  const calendarDayMeta = useMemo(() => {
    const shiftsByDay: Record<DayKey, Shift[]> = {};
    for (const shift of shifts) {
      const key = format(parseISO(shift.startTime), 'yyyy-MM-dd');
      (shiftsByDay[key] ??= []).push(shift);
    }

    for (const key of Object.keys(shiftsByDay)) {
      shiftsByDay[key]?.sort(
        (a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      );
    }

    const timeOffCountByDay: Record<DayKey, number> = {};
    for (const entry of timeOff) {
      timeOffCountByDay[entry.date] = (timeOffCountByDay[entry.date] ?? 0) + 1;
    }

    const out: Record<string, React.ReactNode> = {};
    const allDayKeys = new Set<string>([
      ...Object.keys(shiftsByDay),
      ...Object.keys(timeOffCountByDay)
    ]);

    for (const dayKey of allDayKeys) {
      const dayShifts = shiftsByDay[dayKey] ?? [];
      const timeOffCount = timeOffCountByDay[dayKey] ?? 0;
      if (dayShifts.length === 0 && timeOffCount === 0) continue;

      const visibleShifts = dayShifts.slice(0, 2);
      const moreCount = dayShifts.length - visibleShifts.length;

      out[dayKey] = (
        <div className="space-y-1">
          {visibleShifts.map((shift) => (
            <div key={shift.id} className="text-[10px] leading-4">
              {format(parseISO(shift.startTime), 'HH:mm')} – {format(parseISO(shift.endTime), 'HH:mm')}
            </div>
          ))}

          {moreCount > 0 ? <div className="text-[10px]">+{moreCount} more</div> : null}

          {timeOffCount > 0 ? (
            <div className="mt-1 inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-amber-900">
                {timeOffCount === 1 ? 'Time off' : `${timeOffCount} time off`}
              </span>
            </div>
          ) : null}
        </div>
      );
    }

    return out;
  }, [shifts, timeOff]);

  useSSEStream(hasValidWorkspace ? workspaceId : null, {
    'shift-updated': () => {
      fetchShifts();
      fetchTeamSchedule(selectedDate);
    }
  });

  if (!hasValidWorkspace) {
    return (
      <div className="mx-auto w-[90vw] max-w-none space-y-6 px-2 py-6 sm:px-4">
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          Error: Invalid workspace id
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[90vw] max-w-none space-y-6 px-2 py-6 sm:px-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyCalendarCard
          className="lg:col-span-2"
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(startOfDay(d))}
          onChangeMonth={(next) => {
            setCurrentMonth(next);
            setSelectedDate(startOfDay(next));
          }}
          onToday={() => {
            const now = new Date();
            setCurrentMonth(now);
            setSelectedDate(startOfDay(now));
          }}
          isLoading={isLoading}
          dayMeta={calendarDayMeta}
        />

        <DayScheduleCard
          selectedDate={selectedDate}
          entries={coworkerEntries}
          shiftTitle="Shift"
          primaryAction={
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold">Your shifts</div>
                {isLoading && shifts.length === 0 ? (
                  <p className="text-muted-foreground mt-1 text-sm">Loading shifts…</p>
                ) : myShiftsForSelectedDay.length === 0 ? (
                  <p className="text-muted-foreground mt-1 text-sm">No shifts scheduled for you.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {myShiftsForSelectedDay.map((shift) => (
                      <ShiftSummaryButton key={shift.id} shift={shift} title="Shift" />
                    ))}
                  </div>
                )}
              </div>

              {timeOffForSelectedDay.length > 0 ? (
                <div>
                  <div className="text-sm font-semibold">Time off</div>
                  <div className="mt-2 space-y-2">
                    {timeOffForSelectedDay.map((entry) => (
                      <div
                        key={`${entry.id}-${entry.date}`}
                        className="bg-card space-y-2 rounded-lg border p-3"
                      >
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <span className="font-medium">Time off – {entry.requesterName}</span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Time off
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {entry.startDate} – {entry.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-t pt-3">
                <div className="text-sm font-semibold">Scheduled coworkers</div>
              </div>
            </div>
          }
          emptyState={
            teamSchedule == null ? (
              <p className="text-muted-foreground text-sm">Loading coworkers…</p>
            ) : (
              <p className="text-muted-foreground text-sm">No coworkers scheduled for this day.</p>
            )
          }
        />
      </div>
    </div>
  );
}
