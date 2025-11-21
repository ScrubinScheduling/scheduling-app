"use client";
import React, { useState, useMemo, useEffect, use } from "react";
import AddShiftModal from "../../../../../../components/AddShiftModal";
import dayjs from "dayjs";
import { Spin, Button, DatePicker, Alert } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { useApiClient } from "@/hooks/useApiClient";
import { 
  getToday, 
  makeWeek, 
  moveWeek,
  onPickWeek } from '../../../../../../helpers/time'; 
import {
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Plus,
  Coffee,
} from "lucide-react";


import {
  format,
  parseISO,
} from "date-fns"; 
import ShiftModal from "../../../../../../components/ShiftModal";


type ApiShift = { id: number; startTime: string; endTime: string; breakDuration: number | null };
type Member = { id: number; firstName: string; lastName?: string | null };
type WeeklyResponse = {
  days: string[];                             
  users: Member[];                          
  buckets: Record<number, Record<string, ApiShift[]>>;
};


const page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const workspaceId = Number(id);
  const hasValidWorkspace = Number.isInteger(workspaceId);
  const emptyWeekly: WeeklyResponse = { days: [], users: [], buckets: {} };
  const [anchor, setAnchor] = useState<Date>(getToday());
  const [isModal, setIsModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [users, setUsers] = useState<Member[]>([]); 
  const [shifts, setShifts] = useState<WeeklyResponse>(emptyWeekly);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<any | undefined>(undefined);
  const [openShiftDetails, setOpenShiftDeatils] = useState<boolean>(false);  
  
  const apiClient = useApiClient();
  const week = useMemo(() => makeWeek(anchor), [anchor]);
  const nextWeek = () => setAnchor(w => moveWeek(w,1).anchor); // Moves 1 week forwards
  const prevWeek = () => setAnchor(w => moveWeek(w,-1).anchor); // Moves 1 week backwards


  const getUsers = async() => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getWorkspaceMembers(id);
      setUsers(response.members ?? []); 
      setIsLoading(false);

    } catch (error) {
      console.log("Error fetching users"); 
      setError("Could not load users");
    } finally {
      setIsLoading(false);
    }
  }

  const getShifts = async() => {
    if (!hasValidWorkspace) return;
    try {
      setIsLoading(true); 
      const params = new URLSearchParams({
        start: week.start.toISOString(),
        end: week.end.toISOString()
      });

      // API client throws error; start/end are required
      const data: WeeklyResponse = await apiClient.getWorkspaceShifts(id, {
        start: week.start.toISOString(),
        end: week.end.toISOString(),
      })
      console.log(data); 
      setShifts(data ?? emptyWeekly); 
      setIsLoading(false);  

    } catch (error) {
      console.log(error);
      setError("Could not load shifts");
    } finally {
      setIsLoading(false); 
    }
  };

  const handleShiftReload = async() => {
    try {
      setIsLoading(true);
      await getShifts();
      setIsModal(false);
      setIsLoading(false);  
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false); 
    }
    
  }

  const handleDelete = async(shiftId: number) => {
      if (!confirm) return;
     
      try {
        setIsLoading(true); 
        await apiClient.deleteShift(id, shiftId); 
        await handleShiftReload();
        setOpenShiftDeatils(false);
        setSelectedShift(null); 
        setSelectedUser(null); 
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
  }

 useEffect( () => {
  if (!hasValidWorkspace) return;
  getUsers();
  getShifts(); // Refetch when workspace changes or week window moves
 }, [hasValidWorkspace, id, week.start, week.end]); 

  return (
      <div className="min-h-screen border-b border-border bg-card px-6 py-4">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-muted py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={prevWeek} size="large">
                <ChevronLeft className="h-4 w-4"/>
              </Button>
              <DatePicker
              value={dayjs(anchor)}
              picker="week"
              onChange={(value) => onPickWeek(value, setAnchor)}
              format={() => format(week.start, "yyyy MMMM d")}
              size="large"
              
              />
              <Button onClick={nextWeek} size="large">
                <ChevronRight className="h-4 w-4"/>
              </Button>
            </div>
            <Button size="large" onClick={() => setAnchor(getToday())}>
              Today
            </Button>
          </div>
          {/* Add connection to AddModalShift */}
          <Button size="large" type="primary" onClick={() => setIsModal(true)}>
            Add Shifts
          </Button>
        </div>

        {/* Day headers */}
        {error && (
          <div className="mb-3">
            <Alert type="error" message={error} showIcon />
          </div>
        )}
        <Spin spinning={isLoading} indicator={<LoadingOutlined />} size="large">
        <div className="flex-1 overflow-auto pt-5">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-sm font-medium text-muted-foreground py-3">Employee</div>
                  {week.days.map(d => (
                    <div key={d.toDateString()} className="text-sm font-medium text-muted-foreground py-3 text-center">
                      <div>{format(d, "EEE")}</div>
                      <div className="text-xs text-muted-foreground/70">{format(d, "MMM d")}</div>
                    </div>
                  ))}
              </div>

              <div className="space-y-1">
                  {users?.map(user => (
                    <div key={user.id} className="grid grid-cols-8 gap-2 border border-border rounded-lg bg-card hover:bg-card/80 transition-colors">
                      {/* Emplyee Profile Card for row */}
                      <div className="flex items-center gap-3 p-4 border-r border-border"> 
                        <UsersRound />
                        <div className="text-sm font-medium text-foreground truncate">{user.firstName}</div>
                      </div>
                      {shifts.days.map(dayKey => {
                        const items = shifts?.buckets[user.id]?.[dayKey] ?? [];
                        return(
                          <div key={dayKey} className="p-2 min-h-[100px] flex flex-col gap-1">
                              {items.length === 0 ? (
                                <Button type="default" className="flex-1">
                                  <Plus />
                                </Button>
                              ): (
                                items.map(shift => (
                                  <Button
                                    key={shift.id}
                                    type="primary"
                                    className="flex-1 w-full justify-start"
                                    onClick={() => {
                                      setSelectedShift(shift);
                                      setSelectedUser(user);
                                      setOpenShiftDeatils(true); 
                                    }}
                                  >
                                    <div className="flex flex-col flex-1 text-left gap-1">
                                      <span className="text-sm font-medium">Manager</span>
                                      <span className="text-xs">
                                        {format(parseISO(shift.startTime), "HH:mm")} to{" "}
                                        {format(parseISO(shift.endTime), "HH:mm")}
                                      </span>
                                      <div className="flex flex-row gap-1 items-center">
                                        <Coffee size={12}/>
                                        <span className="text-xs">{shift.breakDuration}min</span>
                                      </div>
                                    </div>
                                  </Button>
                                ))
                              )}
                          </div>
                        )
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
          />
        )}
        <AddShiftModal open={isModal} setOpen={setIsModal} users={users} workspaceId={Number(id)} onSuccess={handleShiftReload} />
      </div>
  );
};

export default page;
