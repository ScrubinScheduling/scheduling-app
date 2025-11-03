"use client";
import {
    UsersRound,
    Plus,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddMemberModal from "../../../../components/AddMemberModal";

type Member = {
  id: number,
  name: string,
  role: string,
  email: string,
  phone: string,
}

export default function TeamPage() {
  // temporary mock data
  const seedmembers: Member[] = [
    { id: 1, name: "Admin Annie", role: "Admin", email: "annie@clinic.com", phone: "306-555-1000"},
    { id: 2, name: "SubAdmin Sam", role: "Sub-Admin", email: "sam@clinic.com", phone: "306-555-2000"},
    { id: 3, name: "Regular Reggie", role: "Employee", email: "reggie@clinic.com", phone: "306-555-3000"},
  ];

  const [members, setMembers] = React.useState<Member[]>(seedmembers);

  // Tracks if that member has a toggled (expanded) row, showing email, phone and remove
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  //Toggle function to switch the setExpanded for true to false and vice versa
  function toggle(id: number){
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null})

  function openConfirm(member: Member) {
    setConfirmState({ open: true, member})
  }

  function closeConfirm() {
    setConfirmState({ open: false, member: null})
  }

  function confirmRemove() {
    const id = confirmState.member?.id
    if (id == null) return;

    setMembers(prev => prev.filter(m => m.id !== id));
    closeConfirm();
    } 

  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-700">
          <UsersRound />
          <h1 className="text-2xl font-semibold text-gray-700">Team</h1>
        </div>
        <div className="text-white">
          <button 
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[#3F37C9] hover:bg-[#2E299A]"
          >
            <Plus size={18} /> Add member
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-gray-400 text-gray-500">
        <table className="min-w-full text-left">
          <colgroup><col className="w-1/2" /><col className="w-5/12" /><col className="w-1/12" /></colgroup>
          <thead className="bg-gray-300">
            <tr className="border-b border-gray-400">
              <th className="p-3 text-gray-800">Name</th>
              <th className="p-3 text-gray-800">Role</th>
              <th className="p-3"></th>
            </tr>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500 bg-white">
                    No team members yet. Click <span className="font-semibold">Add member</span> to invite someone.
                  </td>
                </tr>
              ) : null}
          </thead>
          
          <tbody className="bg-white">
            {members.map((m) => {
              const isOpen = expanded[m.id];
              const detailsRowId = `row-${m.id}-details`;

            return (
              <React.Fragment key={m.id}>
                <tr className="border-t border-gray-400">
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
                        <div className="text-sm font-medium text-gray-500">
                          Email: <span className="font-normal">{m.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3">
                        <div className="text-sm font-medium text-gray-500">
                          Phone: <span className="font-normal">{m.phone}</span>
                        </div>
                      </td>

                      {/* Remove Button */}
                      <td className="p-3">
                        <div className="flex justify-end pr-1">
                          <AlertDialog open={confirmState.open} onOpenChange={(o) => !o && closeConfirm()}>
                            {/* We use a normal button to set the member, then programmatically open */}
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openConfirm(m)}           // <-- set the member, open dialog
                                className="inline-flex items-center rounded-lg px-3 py-2 bg-red-600 hover:bg-red-700"
                              >
                                <div className="text-white">
                                Remove
                                </div>
                              </button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold">
                                  Remove {confirmState.member?.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-700">
                                  This will remove this user from your team. You cannot undo this action.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeConfirm} className="hover:border-blue-500">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
                                  <div className="text-white">
                                  Confirm remove
                                  </div>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      <AddMemberModal
        open={addOpen}
        setOpen={setAddOpen}
        inviteLink="https://google.com"
      />
    </main>
  );
}
