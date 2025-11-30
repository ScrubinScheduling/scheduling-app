"use client";

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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import {
  Plus,
  X as XIcon,
  CalendarDays,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import MeetingModal, { MeetingForModal } from "../../../../../../../components/MeetingModal";

const API = process.env.NEXT_PUBLIC_API_BASE_URL as string;

/**** Types ****/

type MeetingStatus = "PENDING" | "FINALIZED" | "CANCELLED" | "RESCHEDULED";

type Meeting = {
  id: string;
  location: string;
  description: string;
  date: string;
  time: string;
  status: MeetingStatus;
  inviteMembershipIds: number[];
  createdById: string;
  attendees: {
    yes: string[];
    no: string[];
    pending: string[];
  };
};

function statusChip(status: MeetingStatus) {
  const map: Record<MeetingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    FINALIZED: "bg-green-200 text-green-800",
    CANCELLED: "bg-red-200 text-red-800",
    RESCHEDULED: "bg-purple-200 text-purple-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

/**** Component ****/

export default function MeetingRequestsPage() {
  const { getToken } = useAuth();
  const { id: workspaceId } = useParams<{ id: string }>();

  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    meeting: Meeting | null;
  }>({ open: false, meeting: null });

  // Status change confirmation dialog (finalize / cancel)
  const [statusConfirm, setStatusConfirm] = React.useState<{
    open: boolean;
    action: "FINALIZED" | "CANCELLED" | null;
  }>({ open: false, action: null });

  const selected = React.useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId]
  );

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [editorMeeting, setEditorMeeting] = React.useState<MeetingForModal | null>(null);
  
  const [reloadToken, setReloadToken] = React.useState(0);
  function refreshMeetings() {
    setReloadToken((t) => t + 1);
  }

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const headers: HeadersInit = {
          Authorization: `Bearer ${token ?? ""}`,
        };

        const res = await fetch(`${API}/workspaces/${workspaceId}/meetings`, {
          headers,
        });

        if (!res.ok) {
          throw new Error(`Meetings HTTP ${res.status}`);
        }

        const data = await res.json();

        // Backend now returns:
        // { meetings: [{ id, location, description, date, time, status, attendees: { yes, no, pending } }, ...] }
        const mapped: Meeting[] = (data.meetings ?? []).map((m: Meeting) => ({
            id: String(m.id),
            location: m.location ?? "No location",
            description: m.description ?? "",
            date: m.date ?? "",
            time: m.time ?? "",
            status: (m.status as MeetingStatus) ?? "PENDING",
            inviteMembershipIds: m.inviteMembershipIds ?? [],
            createdById: m.createdById ?? "",
            attendees: {
                yes: m.attendees?.yes ?? [],
                no: m.attendees?.no ?? [],
                pending: m.attendees?.pending ?? [],
            },
        }));

        if (!alive) return;
        setMeetings(mapped);
        setSelectedId((prev) => prev || mapped[0]?.id || "");
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load meetings");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [workspaceId, getToken, reloadToken]);

  /***** Delete handlers *****/

  function openDeleteConfirm(meeting: Meeting, e: React.MouseEvent) {
    e.stopPropagation(); // don't also select the card
    setDeleteConfirm({ open: true, meeting });
  }

  function closeDeleteConfirm() {
    setDeleteConfirm({ open: false, meeting: null });
  }

  async function handleDelete() {
    if (!deleteConfirm.meeting) return;

    const meetingId = deleteConfirm.meeting.id;

    try {
      const token = await getToken();
      const res = await fetch(
        `${API}/workspaces/${workspaceId}/meetings/${meetingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
          },
        }
      );

      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }

      setMeetings((prev) => {
        const idx = prev.findIndex((m) => m.id === meetingId);
        const next = prev.filter((m) => m.id !== meetingId);
        const nextSelected =
          next[idx]?.id ?? next[idx - 1]?.id ?? (selectedId === meetingId ? "" : selectedId);
        setSelectedId(nextSelected);
        return next;
      });
    } catch (err) {
      setError(
        `Failed to delete meeting${
          err instanceof Error ? `: ${err.message}` : ""
        }`
      );
    } finally {
      closeDeleteConfirm();
    }
  }

  /***** Status handlers (Finalize / Cancel) *****/

  function openStatusConfirm(action: "FINALIZED" | "CANCELLED") {
    setStatusConfirm({ open: true, action });
  }

  function closeStatusConfirm() {
    setStatusConfirm({ open: false, action: null });
  }

  async function applyStatusChange() {
    if (!selected || !statusConfirm.action) return;

    const meetingId = selected.id;
    const action = statusConfirm.action;
    const path = action === "FINALIZED" ? "finalize" : "cancel";

    try {
      const token = await getToken();
      const res = await fetch(
        `${API}/workspaces/${workspaceId}/meetings/${meetingId}/${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId ? { ...m, status: action } : m
        )
      );
    } catch (err) {
      setError(
        `Failed to ${action === "FINALIZED" ? "Finalize" : "Cancel"} meeting${
          err instanceof Error ? `: ${err.message}` : ""
        }`
      );
    } finally {
      closeStatusConfirm();
    }
  }

  return (
    <main className="p-4 max-w-6xl mx-auto">
      {/* Header with Create Meeting button */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          Meeting Requests
        </h1>
        <div className="text-white">
          <button
            type="button"
            onClick={() => {
                setEditorMode("create");
                setEditorMeeting(null);
                setEditorOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[#3F37C9] hover:bg-[#2E299A]"
            >
            <Plus size={18} /> Create Meeting
            </button>
        </div>
      </header>

      <div className="flex min-height-[640px] min-h-[640px]">
        {/* Left pane: meeting list */}
        <aside className="w-1/2 p-2 pr-3">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Meetings</h2>

          {loading && (
            <div className="mb-3 text-sm text-gray-500">Loading Meetings…</div>
          )}
          {error && (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              Error: {error}
            </div>
          )}

          <div className="space-y-3">
            {meetings.length === 0 && !loading ? (
              <div className="mt-10 text-center text-gray-500 italic">
                There are currently no meetings!
              </div>
            ) : (
              meetings.map((m) => {
                const isSelected = m.id === selectedId;
                const baseCard =
                  "relative cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm";
                const selectedRing = isSelected
                  ? "border-gray-900 shadow-sm"
                  : "border-gray-200";

                return (
                  <div
                    key={m.id}
                    className={`${baseCard} ${selectedRing} bg-white`}
                    onClick={() => setSelectedId(m.id)}
                  >
                    {/* Delete X in top-right */}
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
                      onClick={(e) => openDeleteConfirm(m, e)}
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
                              {m.location}
                            </span>
                            <span className="text-xs text-gray-600">
                              {m.date}
                              {m.time ? ` @ ${m.time}` : ""}
                            </span>
                          </div>
                        </div>
                        {statusChip(m.status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right pane: details */}
        <section className="w-1/2 p-2 pl-3">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Details</h2>

          {!selected ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Select a meeting to see details
            </div>
          ) : (
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
                {statusChip(selected.status)}
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
                        setEditorMode("edit");
                        setEditorMeeting({
                        id: selected.id,
                        location: selected.location,
                        description: selected.description,
                        date: selected.date,
                        time: selected.time,
                        inviteMembershipIds: selected.inviteMembershipIds,
                        createdById: selected.createdById
                        });
                        setEditorOpen(true);
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
          )}
        </section>
      </div>

      {/* Delete confirmation dialog */}
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
              onClick={applyStatusChange}
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
      <MeetingModal
        open={editorOpen}
        mode={editorMode}
        meeting={editorMeeting}
        onClose={() => setEditorOpen(false)}
        onSaved={refreshMeetings}
      />
    </main>
    
  );
}
