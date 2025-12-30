"use client";

import React, { useCallback, useMemo } from "react";
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
import { useApiClient } from "@/hooks/useApiClient";
import { useSSEStream } from "@/hooks/useSSE";
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
import MeetingModal, { MeetingForModal } from "@/components/MeetingModal";




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
    PENDING: "border border-border bg-muted text-muted-foreground",
    FINALIZED: "border border-primary/20 bg-primary/10 text-primary",
    CANCELLED: "border border-destructive/20 bg-destructive/10 text-destructive",
    RESCHEDULED: "border border-border bg-secondary text-secondary-foreground",
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
  const apiClient = useApiClient(); 

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

  const refreshMeetings = useCallback( () => {
    setReloadToken((t) => t + 1); 
  }, []);

  useSSEStream(Number(workspaceId), useMemo( () => ({
    'meeting-updated' :  () => refreshMeetings(),
  }), [refreshMeetings]));
  
  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.getMeetingsByWorkspace(workspaceId);

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

      await apiClient.deleteMeeting(workspaceId, meetingId); 

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

      await apiClient.updateMeetingStatus(workspaceId, meetingId, path); 

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
        <h1 className="text-xl font-semibold text-foreground">
          Meeting Requests
        </h1>
        <div>
          <button
            type="button"
            onClick={() => {
                setEditorMode("create");
                setEditorMeeting(null);
                setEditorOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
            <Plus size={18} /> Create Meeting
            </button>
        </div>
      </header>

      <div className="flex min-height-[640px] min-h-[640px]">
        {/* Left pane: meeting list */}
        <aside className="w-1/2 p-2 pr-3">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Meetings</h2>

          {loading && (
            <div className="mb-3 text-sm text-muted-foreground">Loading Meetings…</div>
          )}
          {error && (
            <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Error: {error}
            </div>
          )}

          <div className="space-y-3">
            {meetings.length === 0 && !loading ? (
              <div className="mt-10 text-center text-muted-foreground italic">
                There are currently no meetings!
              </div>
            ) : (
              meetings.map((m) => {
                const isSelected = m.id === selectedId;
                const baseCard =
                  "relative cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm";
                const selectedRing = isSelected
                  ? "border-ring shadow-sm"
                  : "border-border";

                return (
                  <div
                    key={m.id}
                    className={`${baseCard} ${selectedRing} bg-card`}
                    onClick={() => setSelectedId(m.id)}
                  >
                    {/* Delete X in top-right */}
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
                      onClick={(e) => openDeleteConfirm(m, e)}
                      title="Delete meeting"
                    >
                      <XIcon size={14} className="text-muted-foreground" />
                    </button>

                    <div className="flex flex-col gap-1 pr-5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-muted p-2">
                            <CalendarDays size={16} className="text-muted-foreground" />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {m.location}
                            </span>
                            <span className="text-xs text-muted-foreground">
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
          <h2 className="mb-3 text-lg font-semibold text-foreground">Details</h2>

          {!selected ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Select a meeting to see details
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-muted p-2">
                    <CalendarDays size={18} className="text-muted-foreground" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {selected.location}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selected.date}
                      {selected.time ? ` @ ${selected.time}` : ""}
                    </span>
                  </div>
                </div>
                {statusChip(selected.status)}
              </div>

              {/* Details body */}
              <div className="space-y-3 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  <span>
                    <span className="font-semibold">Date/Time:</span>{" "}
                    {selected.date}
                    {selected.time ? ` @ ${selected.time}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <span>
                    <span className="font-semibold">Location:</span>{" "}
                    {selected.location}
                  </span>
                </div>

                {selected.description && (
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="font-semibold">Description</span>
                    </div>
                    <p className="ml-6 text-muted-foreground">
                      {selected.description}
                    </p>
                  </div>
                )}

                {/* Attendance groups */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold text-primary">
                      Can make it
                    </div>
                    <ul className="mt-1 space-y-0.5 text-xs text-foreground">
                      {selected.attendees.yes.length === 0 ? (
                        <li className="text-muted-foreground italic">None</li>
                      ) : (
                        selected.attendees.yes.map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-destructive">
                      Cannot make it
                    </div>
                    <ul className="mt-1 space-y-0.5 text-xs text-foreground">
                      {selected.attendees.no.length === 0 ? (
                        <li className="text-muted-foreground italic">None</li>
                      ) : (
                        selected.attendees.no.map((name, idx) => (
                          <li key={idx}>{name}</li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      Pending response
                    </div>
                    <ul className="mt-1 space-y-0.5 text-xs text-foreground">
                      {selected.attendees.pending.length === 0 ? (
                        <li className="text-muted-foreground italic">None</li>
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
                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={() => openStatusConfirm("CANCELLED")}
                    className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
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
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                    >
                    Reschedule
                    </button>

                  {/* Finalize */}
                  <button
                    type="button"
                    onClick={() => openStatusConfirm("FINALIZED")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
            <AlertDialogDescription className="text-muted-foreground">
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
              className="hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Delete
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
            <AlertDialogDescription className="text-muted-foreground">
              {statusConfirm.action === "FINALIZED"
                ? "Finalizing this meeting confirms that it will go ahead as scheduled based on the current responses."
                : "Cancelling this meeting will mark it as cancelled and notify attendees accordingly."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeStatusConfirm}
              className="hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={applyStatusChange}
              className={
                statusConfirm.action === "FINALIZED"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {statusConfirm.action === "FINALIZED"
                ? "Confirm Finalize"
                : "Confirm Cancel"}
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
