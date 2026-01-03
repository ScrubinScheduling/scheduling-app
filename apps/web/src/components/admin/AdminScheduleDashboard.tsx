'use client';
import React, { useMemo, use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkspaceMonthlySchedule } from '@/hooks/useWorkspaceMonthlySchedule';

import { getToday } from '../../../helpers/time';

import { format, isBefore, startOfDay } from 'date-fns';
import MonthlyCalendarCard from '@/components/schedule/MonthlyCalendarCard';
import DayScheduleCard from '@/components/schedule/DayScheduleCard';
import AdminScheduleActions from '@/components/admin/AdminScheduleActions';
import AdminScheduleModals from '@/components/admin/AdminScheduleModals';
import type { DayKey } from '@scrubin/schemas';

export default function AdminScheduleDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workspaceIdNumber = Number(id);
  const hasValidWorkspace = Number.isInteger(workspaceIdNumber);
  const today = startOfDay(getToday());
  const [currentMonth, setCurrentMonth] = useState<Date>(getToday());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { users, schedule, isLoading, error, deleteShift } = useWorkspaceMonthlySchedule(id, currentMonth);

  const shiftCountByDayKey = useMemo(() => {
    const out: Record<DayKey, number> = {};
    for (const userId of Object.keys(schedule.buckets ?? {})) {
      const byDay = schedule.buckets[userId] ?? {};
      for (const [dayKey, items] of Object.entries(byDay)) {
        out[dayKey] = (out[dayKey] ?? 0) + (items?.length ?? 0);
      }
    }
    return out;
  }, [schedule]);

  const selectedDayKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const scheduledEntries = useMemo(() => {
    return users
      .map((user) => ({
        user,
        shifts: schedule?.buckets?.[user.id]?.[selectedDayKey] ?? []
      }))
      .filter((entry) => entry.shifts.length > 0);
  }, [users, schedule, selectedDayKey]);

  const isSelectedDateInPast = isBefore(startOfDay(selectedDate), today);

  const calendarDayMeta = useMemo(() => {
    const out: Record<string, React.ReactNode> = {};
    for (const [dayKey, count] of Object.entries(shiftCountByDayKey)) {
      if (!count) continue;
      out[dayKey] = `${count} ${count === 1 ? 'shift scheduled' : 'shifts scheduled'}`;
    }
    return out;
  }, [shiftCountByDayKey]);

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
    <AdminScheduleModals
      workspaceId={workspaceIdNumber}
      users={users}
      onDeleteShift={(shiftId) => deleteShift(shiftId, { confirm: false })}
    >
      {({ openBulkAssign, openShiftDetails, openSingleAddShift }) => (
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
              headerActions={<AdminScheduleActions onBulkAssign={openBulkAssign} disabled={isLoading} />}
            />

            <DayScheduleCard
              selectedDate={selectedDate}
              entries={scheduledEntries}
              shiftTitle="Manager"
              primaryAction={
                <Button
                  size="lg"
                  disabled={isSelectedDateInPast}
                  onClick={() => {
                    if (isSelectedDateInPast) return;
                    openSingleAddShift({ date: selectedDate, user: null });
                  }}
                >
                  Schedule on this date
                </Button>
              }
              onShiftClick={(shift, user) => openShiftDetails({ user, shift })}
            />
          </div>
        </div>
      )}
    </AdminScheduleModals>
  );
}

