'use client';

import * as React from 'react';
import { UsersRound } from 'lucide-react';

import { cn } from '@/lib/utils';

import ShiftSummaryButton from '@/components/schedule/ShiftSummaryButton';
import type { Shift, User } from '@scrubin/schemas';

export type ScheduledUserCardProps = {
  user: User;
  shifts: Shift[];
  shiftTitle?: React.ReactNode;
  onShiftClick?: (shift: Shift) => void;
  className?: string;
};

export default function ScheduledUserCard({
  user,
  shifts,
  shiftTitle = 'Shift',
  onShiftClick,
  className
}: ScheduledUserCardProps) {
  return (
    <div className={cn('rounded-lg border p-3', className)}>
      <div className="flex items-center gap-2">
        <UsersRound className="text-muted-foreground h-4 w-4" />
        <div className="min-w-0 flex-1 truncate text-sm font-medium">
          {user.firstName} {user.lastName ?? ''}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {shifts.map((shift) => (
          <ShiftSummaryButton key={shift.id} shift={shift} title={shiftTitle} onClick={onShiftClick} />
        ))}
      </div>
    </div>
  );
}

