"use client";
import {
    UsersRound,
    Plus,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import React from "react";

type Member = {
  id: number,
  name: string,
  role: string,
  email: string,
  phone: string,
}

export default function TeamPage() {
  // temporary mock data
  const members: Member[] = [
    { id: 1, name: "Admin Annie", role: "Admin", email: "annie@clinic.com", phone: "306-555-1000"},
    { id: 2, name: "SubAdmin Sam", role: "Sub-Admin", email: "sam@clinic.com", phone: "306-555-2000"},
    { id: 3, name: "Regular Reggie", role: "Employee", email: "reggie@clinic.com", phone: "306-555-3000"},
  ];

  // Tracks if that member has a toggled (expanded) row, showing email, phone and remove
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  //Toggle function to switch the setExpanded for true to false and vice versa
  function toggle(id: number){
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-700">
          <UsersRound />
          <h1 className="text-2xl font-semibold text-gray-700">Team</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[#3F37C9] text-white hover:bg-[#2E299A]">
          <Plus size={18} /> Add member
        </button>
      </header>

      <div className="overflow-x-auto rounded-2xl border text-gray-500">
        <table className="min-w-full text-left">
          <colgroup>
            <col className="w-1/2" />     {/* Name */}
            <col className="w-5/12" />    {/* Role */}
            <col className="w-1/12" />    {/* Actions (chevron/remove) */}
          </colgroup>
          <thead className="bg-gray-300">
            <tr>
              <th className="p-3 text-gray-800">Name</th>
              <th className="p-3 text-gray-800">Role</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          
          <tbody className="bg-white">
            {members.map((m) => {
              const isOpen = expanded[m.id];
              const detailsRowId = `row-${m.id}-details`;

            return (
              <React.Fragment key={m.id}>
                <tr className="border-t">
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.role}</td>
                  <td className="p-3">
                    <div className="flex justify-end pr-1">
                      <button
                        type="button"
                        onClick={() => toggle(m.id)}
                        title={isOpen ? "Collapse details" : "Expand details"}
                        className="inline-flex items-center rounded-md px-2 py-1 hover:bg-gray-200"
                      >
                        {isOpen ? (
                          <ChevronUp size={18} className="text-gray-700" aria-hidden="true" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-700" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr id={detailsRowId} className="border-t border-gray-300 ">
                      {/* Email */}
                      <td className="p-3">
                        <div className="text-sm font-medium text-gray-700">
                          Email: <span className="font-normal">{m.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3">
                        <div className="text-sm font-medium text-gray-700">
                          Phone: <span className="font-normal">{m.phone}</span>
                        </div>
                      </td>

                      {/* Remove Button */}
                      <td className="p-3">
                        <div className="flex justify-end pr-1 text-white">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-lg px-3 py-2 bg-red-600 hover:bg-red-800"
                        >
                          Remove
                        </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
            );
          })}
        </tbody>
        </table>
      </div>
    </main>
  );
}
