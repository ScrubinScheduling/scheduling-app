"use client";
import React, { useState } from "react";
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
} from "lucide-react";
import { start } from "repl";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const page = () => {

  const [currentWeek, setCurrentWeek] = useState(new Date());

  const [members, setMemvbers] = useState([
    {
      id: 1,
      name: "Alice",
      role: "Admin",
      startTime: "09:00",
      endTime: "17:00",
      day: "Monday",
    },
    {
      id: 2,
      name: "Bob",
      role: "User",
      startTime: "10:00",
      endTime: "18:00",
      day: "Tuesday",
    },
    {
      id: 3,
      name: "Charlie",
      role: "User",
      startTime: "08:00",
      endTime: "16:00",
      day: "Wednesday",
    },
    {
      id: 4,
      name: "David",
      role: "User",
      startTime: "11:00",
      endTime: "19:00",
      day: "Thursday",
    },
    {
      id: 5,
      name: "Eve",
      role: "Admin",
      startTime: "07:00",
      endTime: "15:00",
      day: "Friday",
    },
  ]);

  const getWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay()); // Set to Sunday
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="w-full bg-white p-4 shadow flex-row justify-between items-center flex border-b-gray-500 border-b">
        {/* Left Header */}
        <div className="flex flex-row gap-4 items-center">
          <div className="p-2 rounded-2xl bg-[#3F37C9] border border-gray-200 shadow-md">
            <Calendar size={30} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Scrubez</h1>
            <p className="text-gray-500 text-sm">
              Fairlight Veterinary Services
            </p>
          </div>
          <div className="flex flex-row gap-4 ml-5">
            <button className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer">
              <LayoutDashboard size={20} color="gray" />
              <h1 className="text-gray-500 text-md">Dashboard</h1>
            </button>
            <button className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer">
              <UsersRound size={20} color="gray" />
              <h1 className="text-gray-500 text-md">Team</h1>
            </button>
            <button className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer">
              <UserRoundCog size={20} color="gray" />
              <h1 className="text-gray-500 text-md">Roles</h1>
            </button>
            <button className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer">
              <Send size={20} color="gray" />
              <h1 className="text-gray-500 text-md">Requests</h1>
            </button>
          </div>
        </div>

        {/* Right Header */}
        <div className="flex flex-row gap-4 items-center">
          <button>
            <Bell size={24} color="gray" />
          </button>
          <button>
            <Bolt size={24} color="gray" />
          </button>
          <div className="flex flex-row gap-2 items-center bg-[#03045e] p-2 rounded-full cursor-pointer">
            <text className="text-white">AD</text>
          </div>
        </div>
      </div>

      <div className="flex flex-row  p-5 justify-between items-center border-b border-gray-200">
        {/* Left */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-row gap-10 items-center shadow-md border p-2 rounded-lg">
            <button onClick={() => {
              const newDate = new Date(currentWeek);
              newDate.setDate(newDate.getDate() - 7);
              setCurrentWeek(newDate);
            }}>
              <ChevronLeft size={24} color="black" />
            </button>
            <button>
              <text className="text-xl text-black ">{getWeekRange()}</text>
            </button>
            <button onClick={() => {
              const newDate = new Date(currentWeek);
              newDate.setDate(newDate.getDate() + 7);
              setCurrentWeek(newDate);
            }}>
              <ChevronRight size={24} color="black" />
            </button>
          </div>
          <button onClick={() => setCurrentWeek(new Date())} className="cursor-pointer">
            <text className="text-md text-white shadow-md p-3 rounded-lg text-lg font-semibold bg-[#F72585]">
              Today
            </text>
          </button>
        </div>

        {/* Right */}
        <div>
          <button className="flex flex-row gap-1 items-center bg-[#3F37C9] px-4 py-2 rounded-lg cursor-pointer">
            <text className="text-white text-lg font-semibold">Create</text>
            <Plus size={20} color="white" />
          </button>
        </div>
      </div>

      {/* View for shifts */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-7 border-x border-gray-200 divide-x divide-gray-200">
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex flex-col items-center justify-center p-4"
            >
              <text className="text-black">{day}</text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;
