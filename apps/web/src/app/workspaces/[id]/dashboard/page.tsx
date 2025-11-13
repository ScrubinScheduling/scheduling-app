"use client";
import { SignedIn } from "@clerk/nextjs";
import React, { useState, useMemo, useEffect, use } from "react";
import AddShiftModal from "../../../../../components/AddShiftModal";
import dayjs from "dayjs";
import { Spin, Button, DatePicker } from "antd";
import { 
  getToday, 
  makeWeek, 
  moveWeek, 
  weekLabel } from '../../../../../helpers/time'; 
import {
  Calendar,
  LayoutDashboard,
  UsersRound,
  UserRoundCog,
  Send,
  Bell,
  Bolt,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
} from "lucide-react";

import {
  addWeeks, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format
} from "date-fns"; 




const page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [anchor, setAnchor] = useState<Date>(getToday());
  const [isModal, setIsModal] = useState<any>(false);
  const [option, setOption] = useState<any | undefined>(undefined); 
  const week = useMemo(() => makeWeek(anchor), [anchor]);
  const currentWeek = weekLabel(week);
  const [users, setUsers] = useState<[] | null>(); 
  const nextWeek = () => setAnchor(w => moveWeek(w,1).anchor); // Moves 1 week forwards
  const prevWeek = () => setAnchor(w => moveWeek(w,-1).anchor); // Moves 1 week backwards

  const getUsers = async() => {
  try {
    const response = await fetch(`http://localhost:4000/get-users/${id}`, {
      headers: {
        "Content-Type": "Application/JSON"
      }
    }); 
    
    if (!response.ok) throw new Error("Was unable to fetch users");
    const data = await response.json();
    console.log(data); 
    setUsers(data.users); 

  } catch (error) {
    // Need a better error handling system
    console.log("Error fetching users"); 
  }
  }

  const getShifts = async() => {
    try {
    
    } catch (error) {
      
    }
  }
 useEffect( () => {
  getUsers();   
 }, []); 
  
  // Could be moved into the helper folder
  // Used to make it so when using datePicker the value
  // By it is in the right format instead of day.js format
  const onPickWeek = (value: dayjs.Dayjs | null) => {
    if (!value) return; 
    const picked = value.toDate();
    setAnchor(picked); 
  }

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
              onChange={onPickWeek}
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
                      <div className="flex items-center gap-3 p-4 border-r border-border"> 
                        <UsersRound />
                        <div className="text-sm font-medium text-foreground truncate">{user.firstName}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
        </div>
        <AddShiftModal open={isModal} setOpen={setIsModal} users={users}/>
      </div>
  );
};

export default page;
