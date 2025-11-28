"use client";
import { CardHeader, CardTitle, Card, CardContent } from '@/components/ui/card';
import { Button, DatePicker, Spin } from 'antd';
import { LoadingOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import React, { useState, useMemo, use, useEffect, useCallback } from 'react';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@clerk/nextjs';
import dayjs from 'dayjs';
import {
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
  startOfDay,
  endOfDay,
  addDays
} from 'date-fns';


type Shift = {
    id: number, 
    date: string,
    startTime: string, 
    endTime: string, 
    role: string,
}

type ApiShift = {
    id: number,
    startTime: string,
    endTime: string,
    breakDuration: number, 
    userId: string,
    workspaceId: string,

}

type WorkspaceShcedule = {
    days: string[];
    users: {id: string; firstName: string | null; lastName: string | null;}[]
    buckets: Record<number, Record<string, ApiShift[]>>;
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function page({ params }: { params: Promise<{ id: string }> }) {
  const apiClient = useApiClient();
  const { id } = use(params);
  const { userId } = useAuth();  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(currentDate); 
  const [shifts, setShifts] = useState<Shift[]>([]); 
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [teamSchedule, setTeamSchedule] = useState<WorkspaceShcedule | null>(null); 
  const [err, setErr] = useState<string>('');
  

  

  const mapApiShift = (shift: ApiShift): Shift => {
    const start = parseISO(shift.startTime);
    const end = parseISO(shift.endTime);

    return {
        id: shift.id, 
        date: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        role: "Shift",
    }
  }
  
  const calendarDays = useMemo( () => {
    const startOfMonthDate = startOfMonth(currentDate);
    const endOfMonthDate = endOfMonth(currentDate); 

    const start = startOfWeek(startOfMonthDate, {weekStartsOn: 0});
    const end = endOfWeek(endOfMonthDate, {weekStartsOn: 0});

    return eachDayOfInterval({start, end});
  }, [currentDate]); 

  const fetchShifts = async() => {
    try {
        setIsloading(true);
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);

        const data = await apiClient.getUserShifts(id, userId, {
            start: monthStart.toISOString(),
            end: monthEnd.toISOString(),
        });

        const apiShifts: ApiShift[] = data.shifts ?? []; 
        setShifts(apiShifts.map(mapApiShift)); 
    } catch (error) {
        console.log(error);
    } finally {
        setIsloading(false); 
    }
  }

  const fetchTeamSchedule = useCallback(async (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(day, 1);

    const data = await apiClient.getWorkspaceShifts(id, 
        {
            start: dayStart.toISOString(),
            end: dayEnd.toISOString()
        }
    ); 

    setTeamSchedule(data);
  }, [apiClient, id]); 

  useEffect(() => {
    if (!selectedDate) return;
    fetchTeamSchedule(selectedDate);
  }, [selectedDate, fetchTeamSchedule])

  const coworkerEntries = useMemo(() => {
    if (!teamSchedule || !selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return teamSchedule.users
        .filter(member => String(member.id) !== userId)
        .map(member => ({
        member,
        shifts: teamSchedule.buckets[member.id]?.[key] ?? [],
        }))
        .filter(entry => entry.shifts.length > 0);
  }, [teamSchedule, selectedDate, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchShifts(); 
  }, [apiClient, id, userId, currentDate])

  const getShiftsForDay = useCallback( (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    return shifts.filter((s) => s.date === key); 
  }, [shifts]); 

  const selectedDayShifts = useMemo(
    () => (selectedDate ? getShiftsForDay(selectedDate) : []),
    [selectedDate, getShiftsForDay]
  )

  const previousMonth = () =>
    setCurrentDate((d) => subMonths(d, 1));

  const nextMonth = () =>
    setCurrentDate((d) => addMonths(d, 1));

  return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className='grid lg:grid-cols-3 gap-6 py-10'>
            <Card className='lg:col-span-2'>
                <CardHeader className='border-b'>
                    <div className="flex items-center justify-between">
                        <CardTitle className='text-2xl font-semibold'>
                            {format(currentDate, "MMMM yyyy")}
                        </CardTitle>
                        <div className='flex gap-4 flex-row'>
                            <div className='flex gap-2 flex-row'>
                                <Button icon={<LeftOutlined/>} onClick={previousMonth}/>
                                <DatePicker
                                    picker="month"
                                    format="MMM"
                                    value={dayjs(currentDate)}
                                    onChange={(value) => {
                                    if (!value) return
                                    // value is a dayjs; convert to Date
                                    setCurrentDate(value.toDate())
                                    setSelectedDate(null)
                                    }}
                                />
                                <Button icon={<RightOutlined/>} onClick={nextMonth}/>
                            </div>
                            
                            <Button type='primary' onClick={() => {
                                const today = new Date();
                                setCurrentDate(today)
                                setSelectedDate(today)
                            }}>
                                Today
                            </Button>
                        </div> 
                    </div>
                </CardHeader>
                <div className='grid grid-cols-7 gap-2 mb-2'>
                    { ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map(day => (
                        <div className="text-center text-xs font-medium text-muted-foreground uppercase py-2"
                        key={day}
                        >
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar Grid */}
                <div className='grid grid-cols-7 gap-2 px-2'>
                    {calendarDays.map((day, index) => {
                        const dayShifts = getShiftsForDay(day);
                        const isCurrentMonthDay = isSameMonth(day, currentDate);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <Button key={index} onClick={() => setSelectedDate(day)}
                            type='default'
                            style={{
                                minHeight: 100,
                                borderRadius: '0.5rem',
                                borderColor: isToday || isSelected ? 'var(--color-primary)' : undefined,
                                borderWidth: isToday ? 2 : 1,
                                textAlign: 'center',
                                opacity: !isCurrentMonthDay ? 0.4 : 1
                            }}
                            >
                                <div className='flex flex-col h-full items-center flex-1 '>
                                    <span className={cn("text-sm font-medium mb-2 pt-2", isToday && "text-primary font-bold")}>
                                        {format(day, "d")}
                                    </span>
                                    <div className='space-y-1.5 w-full'>
                                        {dayShifts.map((shift) => (
                                            <div key={shift.id} className='space-y-0.5'>
                                                <div className='text-[11px] font-medium text-foreground truncate'>
                                                    {/* Where user role will go once implemented */}
                                                    <span>Manager</span>
                                                </div>

                                                <div className='text-[10px] text-muted-foreground'>
                                                    {shift.startTime} - {shift.endTime}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Button>
                        )
                    })}

                </div>
                {isLoading && (
                    <Spin spinning={isLoading} indicator={<LoadingOutlined />}/>
                )}
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {selectedDate
                        ? format(selectedDate, "EEEE, MMMM d")
                        : "Select a date"}
                    </CardTitle>
                </CardHeader>

                <CardContent className='flex flex-col gap-3'>
                {selectedDate && selectedDayShifts.length > 0 ? (
                    <div className="space-y-3">
                    {selectedDayShifts.map((shift) => (
                        <div
                        key={shift.id}
                        className="p-4 rounded-lg border bg-card space-y-2"
                        >   
                            {/* Shift card */}
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {shift.startTime} - {shift.endTime}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Shift
                                </span>
                            </div>
                        </div>
                    ))}
                    </div>
                    ) : selectedDate ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                        No shifts scheduled for this day
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                        Click on a date to view shift details
                        </p>
                    )}

                    <CardTitle className='text-lg'>
                        Scheduled:
                    </CardTitle>

                    <div>
                        {coworkerEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No coworkers scheduled for this day.
                        </p>
                        ) : (
                        <div className="space-y-3">
                            {coworkerEntries.map(({ member, shifts }) => (
                            <div key={member.id} className="border rounded-lg p-3">
                                <div className="text-sm font-medium">
                                {member.firstName} {member.lastName ?? ''}
                                </div>
                                <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                {shifts.map(shift => (
                                    <div key={shift.id}>
                                    {format(parseISO(shift.startTime), 'HH:mm')} – {format(parseISO(shift.endTime), 'HH:mm')}
                                    </div>
                                ))}
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
