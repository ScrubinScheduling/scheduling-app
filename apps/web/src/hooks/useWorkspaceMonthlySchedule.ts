'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';
import type { User, WorkspaceMonthlySchedule } from '@scrubin/schemas';
import { emptyWorkspaceMonthlySchedule } from '@scrubin/schemas';

type WorkspaceMembersResponse = {
  members?: User[];
};

export function useWorkspaceMonthlySchedule(workspaceId: string | number, currentMonth: Date) {
  const api = useApiClient();
  const workspaceIdString = String(workspaceId);

  const workspaceIdNumber = useMemo(() => {
    const n = Number(workspaceIdString);
    return Number.isInteger(n) ? n : null;
  }, [workspaceIdString]);

  const hasValidWorkspace = workspaceIdNumber != null;

  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<WorkspaceMonthlySchedule>(emptyWorkspaceMonthlySchedule);
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState(0);

  const isLoading = loadingCount > 0;

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>) => {
    setLoadingCount((c) => c + 1);
    try {
      return await fn();
    } finally {
      setLoadingCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const fetchUsers = useCallback(() => {
    if (!hasValidWorkspace) return Promise.resolve();

    return withLoading(async () => {
      const res: WorkspaceMembersResponse = await api.getWorkspaceMembers(workspaceIdString);
      setUsers(res.members ?? []);
    });
  }, [api, hasValidWorkspace, workspaceIdString, withLoading]);

  const fetchSchedule = useCallback(() => {
    if (!hasValidWorkspace) return Promise.resolve();

    return withLoading(async () => {
      const monthStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
      // backend expects an exclusive end; use the start of the day *after* the last visible day
      const monthEndExclusive = addDays(
        startOfDay(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })),
        1
      );

      // API client throws error; start/end are required
      const data: WorkspaceMonthlySchedule | null = await api.getWorkspaceShifts(workspaceIdString, {
        start: monthStart.toISOString(),
        end: monthEndExclusive.toISOString()
      });

      setSchedule(data ?? emptyWorkspaceMonthlySchedule);
    });
  }, [api, currentMonth, hasValidWorkspace, workspaceIdString, withLoading]);

  useEffect(() => {
    if (!hasValidWorkspace) return;

    setError(null);
    void fetchUsers().catch((err) => {
      console.error('Error fetching users:', err);
      setError('Could not load users');
    });
  }, [fetchUsers, hasValidWorkspace]);

  useEffect(() => {
    if (!hasValidWorkspace) return;

    setError(null);
    void fetchSchedule().catch((err) => {
      console.error('Error fetching shifts:', err);
      setError('Could not load shifts');
    });
  }, [fetchSchedule, hasValidWorkspace]);

  useSSEStream(workspaceIdNumber, {
    'shift-updated': () => {
      void fetchSchedule();
    }
  });

  const deleteShift = useCallback(
    async (shiftId: number) => {
      if (!hasValidWorkspace) return;
      // Fix confirm guard bug: confirm is a function; call window.confirm instead.
      if (!window.confirm('Delete this shift?')) return;

      setError(null);

      await withLoading(async () => {
        await api.deleteShift(workspaceIdString, shiftId);
        await fetchSchedule();
      });
    },
    [api, fetchSchedule, hasValidWorkspace, workspaceIdString, withLoading]
  );

  return { users, schedule, isLoading, error, refetch: fetchSchedule, deleteShift };
}

