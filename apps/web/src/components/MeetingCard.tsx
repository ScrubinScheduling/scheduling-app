import { XIcon, CalendarDays } from "lucide-react";
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Meeting } from "@scrubin/schemas";
import { mapStatusChip } from "@/lib/utils";

export default function MeetingCard({
    meeting,
    onSelect,
    isSelected,
    onDelete
}: {
    meeting: Meeting;
    onSelect: (id: number) => void;
    isSelected: boolean;
    onDelete: (id: number) => void;
}) {

    const baseCard =
        "relative cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm";
    const selectedRing = isSelected
        ? "border-gray-900 shadow-sm"
        : "border-gray-200";

    // Delete confirmation dialog
    const [deleteConfirm, setDeleteConfirm] = React.useState<{
        open: boolean;
        meeting: Meeting | null;
    }>({ open: false, meeting: null });


    function openDeleteConfirm(meeting: Meeting, e: React.MouseEvent) {
        e.stopPropagation(); // don't also select the card
        setDeleteConfirm({ open: true, meeting });
    }

    function closeDeleteConfirm() {
        setDeleteConfirm({ open: false, meeting: null });
    }

    function handleDelete() {
        if (!deleteConfirm.meeting) return;
        onDelete(deleteConfirm.meeting.id);
        closeDeleteConfirm();
    }

    return (
        <>
            <div
                key={meeting.id}
                className={`${baseCard} ${selectedRing} bg-white`}
                onClick={() => onSelect(meeting.id)}
            >
                {/* Delete X in top-right */}
                <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
                    onClick={(e) => openDeleteConfirm(meeting, e)}
                    title="Delete meeting"
                >
                    <XIcon size={14} className="text-gray-500" />
                </button>

                <div className="flex flex-col gap-1 pr-5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-gray-100 p-2">
                                <CalendarDays size={16} className="text-gray-700" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">
                                    {meeting.location}
                                </span>
                                <span className="text-xs text-gray-600">
                                    {meeting.date}
                                    {meeting.time ? ` @ ${meeting.time}` : ""}
                                </span>
                            </div>
                        </div>
                        <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold 
                            ${mapStatusChip(meeting.status)}`}
                        >
                            {meeting.status}
                        </span>
                    </div>
                </div>
            </div>
            <AlertDialog
                open={deleteConfirm.open}
                onOpenChange={(o) => {
                    if (!o) closeDeleteConfirm();
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold">
                            Delete this meeting?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                            This will permanently delete the meeting{" "}
                            <span className="font-semibold">
                                {deleteConfirm.meeting?.location}
                            </span>{" "}
                            and all associated responses. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={closeDeleteConfirm}
                            className="hover:bg-gray-300"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-700 hover:bg-red-800"
                        >
                            <span className="text-white">Confirm Delete</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
