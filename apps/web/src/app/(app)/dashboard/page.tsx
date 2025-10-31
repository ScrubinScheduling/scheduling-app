"use client";
import { SignedIn } from "@clerk/nextjs";
import React, { useState } from "react";
import { Spin } from "antd";
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
import AddShiftModal from "../../../../components/AddShiftModal";

type Shift = {
  id: number;
  name: string;
  role: string;
  startTime: string;
  endTime: string;
  day: string;
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  {
    /* Modal Selections */
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  const [shift, setShift] = useState<Shift[]>([
    {
      id: 1,
      name: "Alice Cartel",
      role: "Vet Tech",
      startTime: "09:00",
      endTime: "17:00",
      day: "Monday",
    },
    {
      id: 2,
      name: "Bob Itsaboy",
      role: "Receptionist",
      startTime: "10:00",
      endTime: "18:00",
      day: "Tuesday",
    },
    {
      id: 3,
      name: "Jonny Bravo",
      role: "Veterinarian",
      startTime: "08:00",
      endTime: "16:00",
      day: "Wednesday",
    },
    {
      id: 4,
      name: "David Suzuki",
      role: "Kennel Attendant",
      startTime: "11:00",
      endTime: "19:00",
      day: "Thursday",
    },
    {
      id: 5,
      name: "Adam Eve",
      role: "Vetrinarian",
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
        <div className="flex flex-row  p-5 justify-between items-center border-b border-gray-200">
          {/* Left */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-row gap-10 items-center shadow-md border p-2 rounded-lg">
              <button
                onClick={() => {
                  const newDate = new Date(currentWeek);
                  newDate.setDate(newDate.getDate() - 7);
                  setCurrentWeek(newDate);
                }}
              >
                <ChevronLeft size={24} color="black" />
              </button>
              <button className="w-60">
                <span className="text-xl text-black ">{getWeekRange()}</span>
              </button>
              <button
                onClick={() => {
                  const newDate = new Date(currentWeek);
                  newDate.setDate(newDate.getDate() + 7);
                  setCurrentWeek(newDate);
                }}
              >
                <ChevronRight size={24} color="black" />
              </button>
            </div>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="cursor-pointer"
            >
              <text className="text-md text-white shadow-md p-3 rounded-lg text-lg font-semibold bg-[#F72585]">
                Today
              </text>
            </button>
          </div>

          {/* Right */}
          <div>
            <button
              className="flex flex-row gap-1 items-center bg-[#3F37C9] px-4 py-2 rounded-lg cursor-pointer"
              onClick={showModal}
            >
              <text className="text-white text-lg font-semibold">Create</text>
              <Plus size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Adding Shifts Modal */}
        <AddShiftModal open={isModalOpen} setOpen={setIsModalOpen} />

        {/* View for shifts */}
        <div className="flex-1 overflow-auto p-6">
          {!isLoading ? (
            <div className="grid grid-cols-7 border-x border-gray-200 divide-x divide-gray-200">
              {DAYS.map((day, index) => (
                <div key={index} className="min-h-[600px]">
                  <div className="flex flex-col items-center justify-center p-4">
                    <text className="text-black text-lg">{day}</text>
                    <text className="text-gray-500 text-lg ">
                      {new Date(
                        currentWeek.getTime() +
                          (index - currentWeek.getDay()) * 86400000
                      ).toLocaleDateString("en-US", { day: "numeric" })}
                    </text>
                  </div>

                  {shift
                    .filter((shift) => shift.day === day)
                    .map((shift, index) => (
                      <div
                        key={index}
                        className="bg-white m-2 p-2 rounded-lg shadow-md flex flex-col gap-1  border-l-4 border-[#F72585]"
                      >
                        <text className="text-black text-sm font-semibold">
                          {shift.name}
                        </text>
                        <text className="text-gray-500 text-sm">
                          {shift.role}
                        </text>
                        <text className="text-gray-500 text-sm flex flex-row items-center">
                          <Clock size={16} className="mr-1" />
                          {shift.startTime} - {shift.endTime}
                        </text>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex  flex-row justify-center items-center h-full">
              <Spin size="large" />
            </div>
          )}
        </div>
      </div>
  );
};

export default page;
