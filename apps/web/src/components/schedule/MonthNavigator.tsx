'use client';

import * as React from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) =>
  format(new Date(2020, monthIndex, 1), 'MMM')
);

export type MonthNavigatorProps = {
  currentMonth: Date;
  onChangeMonth: (next: Date) => void;
  disabled?: boolean;
  className?: string;
};

export default function MonthNavigator({
  currentMonth,
  onChangeMonth,
  disabled,
  className
}: MonthNavigatorProps) {
  const currentMonthIndex = currentMonth.getMonth();
  const currentYear = currentMonth.getFullYear();

  const yearOptions = React.useMemo(() => {
    const start = currentYear - 50;
    return Array.from({ length: 101 }, (_, i) => start + i);
  }, [currentYear]);

  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onChangeMonth(subMonths(currentMonth, 1))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Select
          disabled={disabled}
          value={String(currentMonthIndex)}
          onValueChange={(value) => {
            const nextMonthIndex = Number(value);
            if (!Number.isInteger(nextMonthIndex)) return;
            onChangeMonth(startOfMonth(new Date(currentYear, nextMonthIndex, 1)));
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
          disabled={disabled}
          value={String(currentYear)}
          onValueChange={(value) => {
            const nextYear = Number(value);
            if (!Number.isInteger(nextYear)) return;
            onChangeMonth(startOfMonth(new Date(nextYear, currentMonthIndex, 1)));
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

      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => onChangeMonth(addMonths(currentMonth, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

