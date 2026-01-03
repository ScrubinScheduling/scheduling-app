'use client';

import * as React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';

import { cn } from '@/lib/utils';

export type MonthGridProps = {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  dayMeta?: Record<string, React.ReactNode>; // keyed by yyyy-MM-dd
  className?: string;
};

export default function MonthGrid({
  currentMonth,
  selectedDate,
  onSelectDate,
  dayMeta,
  className
}: MonthGridProps) {
  const calendarDays = React.useMemo(() => {
    const monthStartDate = startOfMonth(currentMonth);
    const monthEndDate = endOfMonth(currentMonth);
    const start = startOfWeek(monthStartDate, { weekStartsOn: 0 });
    const end = endOfWeek(monthEndDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div className={cn('flex flex-1 flex-col', className)}>
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
        {calendarDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const meta = dayMeta?.[dayKey];
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex h-full flex-col items-start justify-start rounded-lg border p-3 text-left transition-colors',
                'hover:bg-muted/50',
                !isCurrentMonthDay && 'opacity-40',
                isToday && 'border-primary border-2',
                isSelected && 'ring-primary/40 ring-2'
              )}
            >
              <span className={cn('text-sm font-medium', isToday && 'text-primary font-bold')}>
                {format(day, 'd')}
              </span>

              {meta != null ? (
                <div className="text-muted-foreground mt-1 text-xs">{meta}</div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

