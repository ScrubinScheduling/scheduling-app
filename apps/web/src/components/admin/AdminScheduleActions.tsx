'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';

export type AdminScheduleActionsProps = {
  onBulkAssign: () => void;
  disabled?: boolean;
  className?: string;
};

export default function AdminScheduleActions({ onBulkAssign, disabled, className }: AdminScheduleActionsProps) {
  return (
    <Button size="lg" onClick={onBulkAssign} disabled={disabled} className={className}>
      Bulk assign shifts
    </Button>
  );
}

