'use client';

import * as React from 'react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import MonthGrid from '@/components/schedule/MonthGrid';
import MonthNavigator from '@/components/schedule/MonthNavigator';

export type MonthlyCalendarCardProps = {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onChangeMonth: (next: Date) => void;
  onToday: () => void;
  isLoading?: boolean;
  dayMeta?: Record<string, React.ReactNode>; // keyed by yyyy-MM-dd
  headerActions?: React.ReactNode;
  className?: string;
};

export default function MonthlyCalendarCard({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  onToday,
  isLoading,
  dayMeta,
  headerActions,
  className
}: MonthlyCalendarCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="lg" onClick={onToday}>
              Today
            </Button>
            {headerActions}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {isLoading ? (
          <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : null}

        <div
          className={cn(
            isLoading && 'pointer-events-none opacity-50',
            'flex min-h-[800px] flex-col'
          )}
        >
          <MonthNavigator currentMonth={currentMonth} onChangeMonth={onChangeMonth} disabled={isLoading} />
          <MonthGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            dayMeta={dayMeta}
          />
        </div>
      </CardContent>
    </Card>
  );
}

