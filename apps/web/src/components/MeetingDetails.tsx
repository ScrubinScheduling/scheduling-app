import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogFooter } from "./ui/alert-dialog";import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import React from "react";
import { mapStatusChip } from "@/lib/utils";

import { Meeting, MeetingStatus } from "@scrubin/schemas";

interface MeetingDetailsProps {
    selected: Meeting;
    onReschedule: () => void;
    onStatusChange: (meetingId: number, status: MeetingStatus) => void;
}

export default function MeetingDetails({ selected, onReschedule, onStatusChange }: MeetingDetailsProps) {
    const [statusConfirm, setStatusConfirm] = React.useState<{
        open: boolean;
        action: "FINALIZED" | "CANCELLED" | null;
    }>({ open: false, action: null });

    function openStatusConfirm(action: "FINALIZED" | "CANCELLED") {
        setStatusConfirm({ open: true, action });
    }

    function closeStatusConfirm() {
        setStatusConfirm({ open: false, action: null });
    }

    function handleStatusChange() {
        if (!selected || !statusConfirm.action) return;

        onStatusChange(selected.id, statusConfirm.action as MeetingStatus)

        closeStatusConfirm();
    }
    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 p-2">
                            <CalendarDays size={18} className="text-gray-700" />
                        </span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                                {selected.location}
                            </span>
                            <span className="text-xs text-gray-600">
                                {selected.date}
                                {selected.time ? ` @ ${selected.time}` : ""}
                            </span>
                        </div>
                    </div>
                    <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold 
                            ${mapStatusChip(selected.status)}`}
                    >
                        {status}
                    </span>
                </div>

                {/* Details body */}
                <div className="space-y-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span>
                            <span className="font-semibold">Date/Time:</span>{" "}
                            {selected.date}
                            {selected.time ? ` @ ${selected.time}` : ""}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span>
                            <span className="font-semibold">Location:</span>{" "}
                            {selected.location}
                        </span>
                    </div>

                    {selected.description && (
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <Users size={16} className="text-gray-500" />
                                <span className="font-semibold">Description</span>
                            </div>
                            <p className="ml-6 text-gray-700">
                                {selected.description}
                            </p>
                        </div>
                    )}

                    {/* Attendance groups */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <div className="text-xs font-semibold text-green-700">
                                Can make it
                            </div>
                            <ul className="mt-1 space-y-0.5 text-xs text-gray-800">
                                {selected.attendees.yes.length === 0 ? (
                                    <li className="text-gray-400 italic">None</li>
                                ) : (
                                    selected.attendees.yes.map((name, idx) => (
                                        <li key={idx}>{name}</li>
                                    ))
                                )}
                            </ul>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-red-700">
                                Cannot make it
                            </div>
                            <ul className="mt-1 space-y-0.5 text-xs text-gray-800">
                                {selected.attendees.no.length === 0 ? (
                                    <li className="text-gray-400 italic">None</li>
                                ) : (
                                    selected.attendees.no.map((name, idx) => (
                                        <li key={idx}>{name}</li>
                                    ))
                                )}
                            </ul>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-yellow-700">
                                Pending response
                            </div>
                            <ul className="mt-1 space-y-0.5 text-xs text-gray-800">
                                {selected.attendees.pending.length === 0 ? (
                                    <li className="text-gray-400 italic">None</li>
                                ) : (
                                    selected.attendees.pending.map((name, idx) => (
                                        <li key={idx}>{name}</li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions: only when pending */}
                {selected.status === "PENDING" && (
                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2 text-white">
                        {/* Cancel */}
                        <button
                            type="button"
                            onClick={() => openStatusConfirm("CANCELLED")}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium hover:bg-red-800"
                        >
                            Cancel Meeting
                        </button>

                        {/* Reschedule (no dialog yet) */}
                        <button
                            type="button"
                            onClick={() => {
                                if (!selected) return;
                                onReschedule();
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
                        >
                            Reschedule
                        </button>

                        {/* Finalize */}
                        <button
                            type="button"
                            onClick={() => openStatusConfirm("FINALIZED")}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            Finalize Meeting
                        </button>
                    </div>
                )}
            </div>

            {/* Status (finalize / cancel) confirmation dialog */}
            <AlertDialog
                open={statusConfirm.open}
                onOpenChange={(o) => {
                    if (!o) closeStatusConfirm();
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold">
                            {statusConfirm.action === "FINALIZED"
                                ? "Finalize this meeting?"
                                : "Cancel this meeting?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                            {statusConfirm.action === "FINALIZED"
                                ? "Finalizing this meeting confirms that it will go ahead as scheduled based on the current responses."
                                : "Cancelling this meeting will mark it as cancelled and notify attendees accordingly."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={closeStatusConfirm}
                            className="hover:bg-gray-300"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStatusChange}
                            className={
                                statusConfirm.action === "FINALIZED"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-700 hover:bg-red-800"
                            }
                        >
                            <span className="text-white">
                                {statusConfirm.action === "FINALIZED"
                                    ? "Confirm Finalize"
                                    : "Confirm Cancel"}
                            </span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </>

    )
}