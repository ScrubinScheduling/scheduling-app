'use client';
import React, { useState, useMemo, useEffect, use, useCallback } from 'react';
import AddShiftModal from '@/components/AddShiftModal';
import dayjs, { Dayjs } from 'dayjs';
import { Spin, Button, DatePicker } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useApiClient } from '@/hooks/useApiClient';
import { useSSEStream } from '@/hooks/useSSE';

import { getToday, makeWeek, moveWeek, onPickWeek } from '../../../../../../helpers/time';
import { UsersRound, ChevronLeft, ChevronRight, Plus, Coffee } from 'lucide-react';

import { format, parseISO } from 'date-fns';
import ShiftModal from '@/components/ShiftModal';
import { Shift, User } from '@scrubin/schemas';
import SingleAddShiftModal from '@/components/SingleAddShiftModal';

type ApiShift = { id: number; startTime: string; endTime: string; breakDuration: number | null };
type WeeklyResponse = {
  days: string[];
  users: User[];
  buckets: Record<string, Record<string, ApiShift[]>>;
};

const emptyWeekly: WeeklyResponse = { days: [], users: [], buckets: {} };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workspaceId = Number(id);
  const hasValidWorkspace = Number.isInteger(workspaceId);
  const [anchor, setAnchor] = useState<Date>(getToday());
  const [isModal, setIsModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<WeeklyResponse>(emptyWeekly);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [openShiftDetails, setOpenShiftDeatils] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [openAddShift, setOpenAddShift] = useState<boolean>(false);

  const apiClient = useApiClient();
  const week = useMemo(() => makeWeek(anchor), [anchor]);
  const nextWeek = () => setAnchor((w) => moveWeek(w, 1).anchor); // Moves 1 week forwards
  const prevWeek = () => setAnchor((w) => moveWeek(w, -1).anchor); // Moves 1 week backwards

  const getUsers = useCallback(async () => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getWorkspaceMembers(id);
      setUsers(response.members ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users: ', error);
      setError('Could not load users');
    } finally {
      setIsLoading(false);
    }
  }, [hasValidWorkspace, id, apiClient]);

  const getShifts = useCallback(async () => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true);

      // API client throws error; start/end are required
      const data: WeeklyResponse = await apiClient.getWorkspaceShifts(id, {
        start: week.start.toISOString(),
        end: week.end.toISOString()
      });
      console.log(data);
      setShifts(data ?? emptyWeekly);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setError('Could not load shifts');
    } finally {
      setIsLoading(false);
    }
  }, [hasValidWorkspace, apiClient, week, id]);

  const handleDelete = async (shiftId: number) => {
    if (!confirm) return;

    try {
      setIsLoading(true);
      await apiClient.deleteShift(id, shiftId);
      //await handleShiftReload();
      setOpenShiftDeatils(false);
      setSelectedShift(null);
      setSelectedUser(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidWorkspace) return;
    getUsers();
    getShifts(); // Refetch when workspace changes or week window moves
  }, [hasValidWorkspace, getUsers, getShifts]);

  useSSEStream(workspaceId, {
    'shift-updated': () => {
      getShifts();
    }
  });

  return (
    <div className="border-border bg-card min-h-screen border-b px-6 py-4">
      {/* Navigation */}
      <div className="border-muted flex items-center justify-between border-b py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={prevWeek}
              size="large"
              className="!border-border !bg-background !text-foreground hover:!bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DatePicker
              value={dayjs(anchor)}
              picker="week"
              onChange={(value) => onPickWeek(value, setAnchor)}
              format={() => format(week.start, 'yyyy MMMM d')}
              size="large"
              className="!border-border !bg-background !text-foreground"
            />
            <Button
              onClick={nextWeek}
              size="large"
              className="!border-border !bg-background !text-foreground hover:!bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="large"
            onClick={() => setAnchor(getToday())}
            className="!border-border !bg-background !text-foreground hover:!bg-muted"
          >
            Today
          </Button>
        </div>
        {/* Add connection to AddModalShift */}
        <Button
          size="large"
          type="primary"
          onClick={() => setIsModal(true)}
          className="!border-primary !bg-primary !text-primary-foreground hover:!bg-primary/90"
        >
          Add Shifts
        </Button>
      </div>

      {/* Day headers */}
      {error && (
        <div className="mb-3">
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            Error: {error}
          </div>
        </div>
      )}
      <Spin spinning={isLoading} indicator={<LoadingOutlined />} size="large">
        <div className="flex-1 overflow-auto pt-5">
          <div className="min-w-[1200px]">
            <div className="mb-2 grid grid-cols-8 gap-2">
              <div className="text-muted-foreground py-3 text-sm font-medium">Employee</div>
              {week.days.map((d) => (
                <div
                  key={d.toDateString()}
                  className="text-muted-foreground py-3 text-center text-sm font-medium"
                >
                  <div>{format(d, 'EEE')}</div>
                  <div className="text-muted-foreground/70 text-xs">{format(d, 'MMM d')}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="border-border bg-card hover:bg-card/80 grid grid-cols-8 gap-2 rounded-lg border transition-colors"
                >
                  {/* Emplyee Profile Card for row */}
                  <div className="border-border flex items-center gap-3 border-r p-4">
                    <UsersRound />
                    <div className="text-foreground truncate text-sm font-medium">
                      {user.firstName}
                    </div>
                  </div>
                  {shifts.days.map((dayKey) => {
                    const items = shifts?.buckets[user.id]?.[dayKey] ?? [];
                    return (
                      <div key={dayKey} className="flex min-h-[100px] flex-col gap-1 p-2">
                        {items.length === 0 ? (
                          <Button
                            type="default"
                            className="!border-border !bg-background !text-muted-foreground hover:!bg-muted flex-1"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedDay(dayjs(dayKey));
                              setOpenAddShift(true);
                            }}
                          >
                            <Plus />
                          </Button>
                        ) : (
                          items.map((shift) => (
                            <Button
                              key={shift.id}
                              type="primary"
                              className="!border-primary !bg-primary !text-primary-foreground hover:!bg-primary/90 w-full flex-1 justify-start"
                              onClick={() => {
                                setSelectedShift(shift);
                                setSelectedUser(user);
                                setOpenShiftDeatils(true);
                              }}
                            >
                              <div className="flex flex-1 flex-col gap-1 text-left">
                                <span className="text-sm font-medium">Manager</span>
                                <span className="text-xs">
                                  {format(parseISO(shift.startTime), 'HH:mm')} to{' '}
                                  {format(parseISO(shift.endTime), 'HH:mm')}
                                </span>
                                <div className="flex flex-row items-center gap-1">
                                  <Coffee size={12} />
                                  <span className="text-xs">{shift.breakDuration}min</span>
                                </div>
                              </div>
                            </Button>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Spin>
      {selectedUser && selectedShift && (
        <ShiftModal
          shift={selectedShift}
          user={selectedUser}
          onDelete={handleDelete}
          workspaceId={workspaceId}
          isVisiable={openShiftDetails}
          setIsVisiable={setOpenShiftDeatils}
          users={users}
        />
      )}
      <SingleAddShiftModal
        open={openAddShift}
        setOpen={setOpenAddShift}
        user={selectedUser}
        selectedDay={selectedDay}
        users={users}
        workspaceId={workspaceId}
      />
      <AddShiftModal open={isModal} setOpen={setIsModal} users={users} workspaceId={Number(id)} />
    </div>
  );
}
