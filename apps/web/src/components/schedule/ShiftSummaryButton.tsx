'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { Coffee } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Shift } from '@scrubin/schemas';

export type ShiftSummaryButtonProps = {
  shift: Shift;
  title?: React.ReactNode;
  onClick?: (shift: Shift) => void;
  className?: string;
};

export default function ShiftSummaryButton({
  shift,
  title = 'Shift',
  onClick,
  className
}: ShiftSummaryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn('h-auto w-full items-start justify-start py-3', className)}
      onClick={() => onClick?.(shift)}
    >
      <div className="min-w-0 flex flex-1 flex-col gap-1 text-left">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs whitespace-nowrap">
          {format(parseISO(shift.startTime), 'HH:mm')} – {format(parseISO(shift.endTime), 'HH:mm')}
        </span>
        {shift.breakDuration != null ? (
          <div className="text-muted-foreground flex flex-row items-center gap-1 text-xs whitespace-nowrap">
            <Coffee size={12} />
            <span>{shift.breakDuration}min</span>
          </div>
        ) : null}
      </div>
    </Button>
  );
}

