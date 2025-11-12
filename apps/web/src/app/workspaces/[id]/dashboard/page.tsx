"use client";
import { SignedIn } from "@clerk/nextjs";
import React, { useState, useMemo } from "react";
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



const page = () => {
  const [anchor, setAnchor] = useState<Date>(getToday());
  const week = useMemo(() => makeWeek(anchor), [anchor]);
  const currentWeek = weekLabel(week); 

  const nextWeek = () => setAnchor(w => moveWeek(w,1).anchor); // Moves 1 week forwards
  const prevWeek = () => setAnchor(w => moveWeek(w,-1).anchor); // Moves 1 week backwards
  
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
        <div className="flex items-center justify-between">
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
        </div>
      </div>
  );
};

export default page;
