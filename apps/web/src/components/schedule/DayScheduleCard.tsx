'use client';

import * as React from 'react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import ScheduledUserCard from '@/components/schedule/ScheduledUserCard';
import type { Shift, User } from '@scrubin/schemas';

export type DayScheduleEntry = {
  user: User;
  shifts: Shift[];
};

export type DayScheduleCardProps = {
  selectedDate: Date;
  entries: DayScheduleEntry[];
  primaryAction?: React.ReactNode;
  shiftTitle?: React.ReactNode;
  onShiftClick?: (shift: Shift, user: User) => void;
  emptyState?: React.ReactNode;
  className?: string;
};

export default function DayScheduleCard({
  selectedDate,
  entries,
  primaryAction,
  shiftTitle = 'Shift',
  onShiftClick,
  emptyState,
  className
}: DayScheduleCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {primaryAction}

        <div className="space-y-3">
          {entries.length === 0 ? (
            emptyState ?? <p className="text-muted-foreground text-sm">No one is scheduled for this day.</p>
          ) : (
            entries.map(({ user, shifts }) => (
              <ScheduledUserCard
                key={user.id}
                user={user}
                shifts={shifts}
                shiftTitle={shiftTitle}
                onShiftClick={(shift) => onShiftClick?.(shift, user)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

