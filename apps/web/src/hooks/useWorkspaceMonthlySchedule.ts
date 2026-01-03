'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';
import type { User, WorkspaceMonthlySchedule } from '@scrubin/schemas';
import { emptyWorkspaceMonthlySchedule } from '@scrubin/schemas';
import { getVisibleMonthWindow } from '../../helpers/schedule';

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
      // backend expects an exclusive end; use the start of the day *after* the last visible day
      const { start: monthStart, endExclusive: monthEndExclusive } = getVisibleMonthWindow(currentMonth, {
        weekStartsOn: 0
      });

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
    async (shiftId: number, options?: { confirm?: boolean }) => {
      if (!hasValidWorkspace) return;
      const shouldConfirm = options?.confirm ?? true;
      // Fix confirm guard bug: confirm is a function; call window.confirm instead.
      if (shouldConfirm && !window.confirm('Delete this shift?')) return;

      setError(null);

      try {
        await withLoading(async () => {
          await api.deleteShift(workspaceIdString, shiftId);
          await fetchSchedule();
        });
      } catch (err) {
        console.error('Error deleting shift:', err);
        setError('Could not delete shift');
      }
    },
    [api, fetchSchedule, hasValidWorkspace, workspaceIdString, withLoading]
  );

  return { users, schedule, isLoading, error, refetch: fetchSchedule, deleteShift };
}

