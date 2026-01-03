'use client';

import * as React from 'react';
import dayjs, { type Dayjs } from 'dayjs';

import AddShiftModal from '@/components/AddShiftModal';
import ShiftModal from '@/components/ShiftModal';
import SingleAddShiftModal from '@/components/SingleAddShiftModal';

import type { Shift, User } from '@scrubin/schemas';

export type OpenSingleAddShiftArgs = {
  date: Date;
  user?: User | null;
};

export type AdminScheduleModalsRenderProps = {
  openBulkAssign: () => void;
  openSingleAddShift: (args: OpenSingleAddShiftArgs) => void;
  openShiftDetails: (args: { user: User; shift: Shift }) => void;
};

export type AdminScheduleModalsProps = {
  workspaceId: number;
  users: User[];
  onDeleteShift?: (shiftId: number) => void | Promise<void>;
  children: (api: AdminScheduleModalsRenderProps) => React.ReactNode;
};

export default function AdminScheduleModals({
  workspaceId,
  users,
  onDeleteShift,
  children
}: AdminScheduleModalsProps) {
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false);

  const [singleAddOpen, setSingleAddOpen] = React.useState(false);
  const [singleAddUser, setSingleAddUser] = React.useState<User | null>(null);
  const [singleAddDay, setSingleAddDay] = React.useState<Dayjs | null>(null);

  const [shiftDetailsOpen, setShiftDetailsOpen] = React.useState(false);
  const [detailsUser, setDetailsUser] = React.useState<User | null>(null);
  const [detailsShift, setDetailsShift] = React.useState<Shift | null>(null);

  const openBulkAssign = React.useCallback(() => setBulkAssignOpen(true), []);

  const openSingleAddShift = React.useCallback(({ date, user }: OpenSingleAddShiftArgs) => {
    setSingleAddUser(user ?? null);
    setSingleAddDay(dayjs(date));
    setSingleAddOpen(true);
  }, []);

  const openShiftDetails = React.useCallback(({ user, shift }: { user: User; shift: Shift }) => {
    setDetailsUser(user);
    setDetailsShift(shift);
    setShiftDetailsOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (shiftId: number) => {
      if (!onDeleteShift) return;
      await onDeleteShift(shiftId);
      setShiftDetailsOpen(false);
      setDetailsShift(null);
      setDetailsUser(null);
    },
    [onDeleteShift]
  );

  React.useEffect(() => {
    if (shiftDetailsOpen) return;
    if (detailsUser == null && detailsShift == null) return;
    setDetailsUser(null);
    setDetailsShift(null);
  }, [detailsShift, detailsUser, shiftDetailsOpen]);

  React.useEffect(() => {
    if (singleAddOpen) return;
    if (singleAddUser == null && singleAddDay == null) return;
    setSingleAddUser(null);
    setSingleAddDay(null);
  }, [singleAddDay, singleAddOpen, singleAddUser]);

  return (
    <>
      {children({ openBulkAssign, openSingleAddShift, openShiftDetails })}

      {detailsUser && detailsShift ? (
        <ShiftModal
          shift={detailsShift}
          user={detailsUser}
          onDelete={handleDelete}
          workspaceId={workspaceId}
          isVisiable={shiftDetailsOpen}
          setIsVisiable={setShiftDetailsOpen}
          users={users}
        />
      ) : null}

      <SingleAddShiftModal
        open={singleAddOpen}
        setOpen={setSingleAddOpen}
        user={singleAddUser}
        selectedDay={singleAddDay}
        users={users}
        workspaceId={workspaceId}
      />

      <AddShiftModal open={bulkAssignOpen} setOpen={setBulkAssignOpen} users={users} workspaceId={workspaceId} />
    </>
  );
}

