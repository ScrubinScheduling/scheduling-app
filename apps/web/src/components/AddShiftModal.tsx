'use client';

import React, { useState } from 'react';
import { startOfDay, isBefore } from 'date-fns';

import { useApiClient } from '@/hooks/useApiClient';
import type { User } from '@scrubin/schemas';

import UserCombobox from '@/components/UserCombobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type AddShiftModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  users: User[];
  workspaceId: number;
};

const AddShiftModal: React.FC<AddShiftModalProps> = ({ open, setOpen, users, workspaceId }) => {
  const [user, setUser] = useState<string | undefined>(undefined);
  const [dates, setDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [alertDesc, setAlertDesc] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const clientAPI = useApiClient();
  const today = startOfDay(new Date());

  const handleCancel = () => {
    setOpen(false);
  };

  const parseTime = (value: string) => {
    const v = value.trim();
    let h: number;
    let m: number;

    // Accept HH:MM
    const colon = v.match(/^(\d{1,2}):(\d{2})$/);
    if (colon) {
      h = Number(colon[1]);
      m = Number(colon[2]);
    } else {
      // Accept 3-4 digits, e.g. 930 or 0930
      const digits = v.match(/^(\d{3,4})$/);
      if (!digits) return null;
      const s = digits[1];
      h = Number(s.slice(0, s.length - 2));
      m = Number(s.slice(-2));
    }

    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { hours: h, minutes: m };
  };

  const formatTime = (t: { hours: number; minutes: number }) =>
    `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;

  const combineDateAndTimeToISOString = (day: Date, time: { hours: number; minutes: number }) => {
    const d = new Date(day);
    d.setHours(time.hours, time.minutes, 0, 0);
    return d.toISOString();
  };

  const handleSubmit = async () => {
    setAlertDesc(null);
    setOpenAlert(false);
    if (!user || dates.length === 0 || !startTime || !endTime) {
      setAlertDesc('Please fill in all fields.');
      setOpenAlert(true);
      return;
    }

    const parsedStart = parseTime(startTime);
    const parsedEnd = parseTime(endTime);
    if (!parsedStart || !parsedEnd) {
      setAlertDesc('Time must be in HH:MM (24h), e.g. 0930 or 09:30.');
      setOpenAlert(true);
      return;
    }

    const startMinutes = parsedStart.hours * 60 + parsedStart.minutes;
    const endMinutes = parsedEnd.hours * 60 + parsedEnd.minutes;
    if (endMinutes <= startMinutes) {
      setAlertDesc('End time must be after start time.');
      setOpenAlert(true);
      return;
    }

    if (dates.some((d) => isBefore(startOfDay(d), today))) {
      setAlertDesc("You can't create shifts in the past.");
      setOpenAlert(true);
      return;
    }

    const shifts = dates.map((d) => ({
      startTime: combineDateAndTimeToISOString(d, parsedStart),
      endTime: combineDateAndTimeToISOString(d, parsedEnd)
    }));

    const payload = {
      user,
      workspaceId,
      breakDuration: 30,
      shifts
    };

    try {
      setIsSubmitting(true);
      const data = await clientAPI.createShift(workspaceId, payload);
      console.log(data);
      console.log('Submitting shift:', payload);

      setAlertDesc(null);
      setOpenAlert(false);
      setUser(undefined);
      setDates([]);
      setStartTime('');
      setEndTime('');

      setOpen(false);
    } catch (e) {
      console.log('Error adding shifts', e);
      setAlertDesc('Could not create shift. Please try again.');
      setOpenAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-center">Add Shifts</DialogTitle>
          </DialogHeader>

          {openAlert ? (
            <Alert variant="destructive">
              <AlertTitle>Missing / invalid fields</AlertTitle>
              <AlertDescription>{alertDesc || 'Please fill in all fields.'}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4">
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Employee</div>
                  <UserCombobox
                    users={users}
                    value={user}
                    onChange={setUser}
                    disabled={isSubmitting}
                    className="w-full md:max-w-[260px]"
                  />
                </div>

                <div className="grid gap-2 md:max-w-[260px]">
                  <div className="text-sm font-medium">Time</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Start (HH:MM)"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      onBlur={() => {
                        const parsed = parseTime(startTime);
                        if (parsed) setStartTime(formatTime(parsed));
                      }}
                      className="h-10 text-base md:text-base"
                      disabled={isSubmitting}
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="End (HH:MM)"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      onBlur={() => {
                        const parsed = parseTime(endTime);
                        if (parsed) setEndTime(formatTime(parsed));
                      }}
                      className="h-10 text-base md:text-base"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="text-muted-foreground text-xs">24h format (e.g. 0930 or 09:30)</div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">Dates</div>
                <div className="rounded-sm border p-2">
                  <Calendar
                    mode="multiple"
                    selected={dates}
                    onSelect={(d) => setDates(d ?? [])}
                    disabled={{ before: today }}
                    className="w-full"
                    
                  />
                </div>
                <div className="text-muted-foreground text-xs">Selected: {dates.length}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="items-center justify-center sm:justify-center">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              Add Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddShiftModal;
