import React from "react";
import { Calendar, LayoutDashboard, UsersRound, UserRoundCog, Send, Bell, Bolt } from "lucide-react";
const page = () => {
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
            <p className="text-gray-500 text-sm">Admin Dashboard</p>
          </div>
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

      <div className="flex flex-row">

      </div>
    </div>
  );
};

export default page;
