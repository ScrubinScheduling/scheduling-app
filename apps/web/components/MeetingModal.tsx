"use client";

import "antd/dist/reset.css";
import React from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

import dayjs, { Dayjs } from "dayjs";
import { TimePicker } from "antd";

import { type MemberApi } from "@scrubin/schemas";

type MemberOption = {
  id: string;            // UserWorkspaceMembership.id (stringified)
  userId: string;        // User.id (Clerk)
  firstName: string;
  lastName: string;
  role: string;
};

type ModalMode = "create" | "edit";

export type MeetingForModal = {
  id: string;
  location: string;
  description: string;
  date: string;
  time: string;                // "HH:MM"
  inviteMembershipIds: number[];
  createdById: string;         // User.id (Clerk)
};

type Props = {
  open: boolean;
  mode: ModalMode;
  meeting?: MeetingForModal | null;
  onClose: () => void;
  onSaved: () => void;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export default function MeetingModal({
  open,
  mode,
  meeting,
  onClose,
  onSaved,
}: Props) {
  const { getToken, userId: currentUserId } = useAuth();
  const { id: workspaceId } = useParams<{ id: string }>();

  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [time, setTime] = React.useState<Dayjs | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch workspace members when modal opens
  React.useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setError(null);
        const token = await getToken();
        const res = await fetch(`${API}/workspaces/${workspaceId}/users`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Clerk user id of the creator
        const creatorUserId =
          mode === "edit" && meeting ? meeting.createdById : currentUserId;
          
        const mapped: MemberOption[] = (data.members  as MemberApi[]?? [])
          .map((m) => ({
            // membershipId (if backend sends it) or fallback to user id
            id: String(m.membershipId ?? m.id),
            userId: String(m.userId ?? m.id),
            firstName: m.firstName ?? "",
            lastName: m.lastName ?? "",
            role: m.role ?? "Member",
          }))
          // filter out the creator by userId, not membershipId
          .filter((m) =>
            creatorUserId ? String(m.userId) !== String(creatorUserId) : true
          );

        setMembers(mapped);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load members"
        );
      }
    })();
  }, [open, workspaceId, getToken, mode, meeting, currentUserId]);

  // Initialize form when opening / switching meeting
  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && meeting) {
      setLocation(meeting.location ?? "");
      setDescription(meeting.description ?? "");
      setSelectedMemberIds(
        (meeting.inviteMembershipIds ?? []).map((id) => String(id))
      );

      // meeting.date is like "Nov 21, 2025"
      let parsedDate: Date | null = null;
      if (meeting.date) {
        const parsed = new Date(meeting.date);
        if (!Number.isNaN(parsed.getTime())) {
          parsedDate = parsed;
        }
      }
      setSelectedDate(parsedDate);

      // meeting.time is "HH:MM"
      if (meeting.time) {
        setTime(dayjs(meeting.time, "HH:mm"));
      } else {
        setTime(null);
      }
    } else {
      setLocation("");
      setDescription("");
      setSelectedDate(null);
      setTime(null);
      setSelectedMemberIds([]);
      setError(null);
    }
  }, [open, mode, meeting]);

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function buildScheduledAt(): string | null {
    if (!selectedDate || !time) return null;

    const hour = time.hour();
    const minute = time.minute();

    const year = selectedDate.getUTCFullYear();
    const month = selectedDate.getUTCMonth(); // 0-based
    const day = selectedDate.getUTCDate();

    // Construct as UTC so the stored time is exactly what the user picked
    const d = new Date(Date.UTC(year, month, day, hour, minute, 0));
    return d.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const scheduledAt = buildScheduledAt();
    if (!scheduledAt) {
      setError("Please provide a valid date and time.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const body = JSON.stringify({
        location,
        description,
        scheduledAt,
        inviteMembershipIds: selectedMemberIds
          .map((id) => Number(id))
          .filter((n) => !Number.isNaN(n)),
      });

      let url: string;
      let method: "POST" | "PATCH";

      if (mode === "create") {
        url = `${API}/workspaces/${workspaceId}/meetings`;
        method = "POST";
      } else {
        if (!meeting?.id) {
          setError("Missing meeting id.");
          return;
        }
        url = `${API}/workspaces/${workspaceId}/meetings/${meeting.id}/reschedule`;
        method = "POST"; // using POST for reschedule
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focusing the first input
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create meeting" : "Reschedule meeting"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Set up a new meeting and choose who should receive an invite."
              : "Update the meeting details. All invite responses will be reset to pending."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      selectedDate.toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ?? undefined}
                    onSelect={(d) => setSelectedDate(d ?? null)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time (24h, Antd) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <TimePicker
                format="HH:mm"
                value={time}
                onChange={(val) => setTime(val)}
                className="w-full"
                minuteStep={5}
              />
            </div>
          </div>

          {/* Invitees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite members
            </label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 px-3 py-2 text-sm space-y-1">
              {members.length === 0 ? (
                <div className="text-gray-400 text-xs">
                  No members found for this workspace.
                </div>
              ) : (
                members.map((m) => {
                  const displayName =
                    `${m.firstName} ${m.lastName}`.trim() || "Unnamed";
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                      />
                      <span>{displayName}</span>
                      <span className="text-xs text-gray-500">· {m.role}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <div className="text-white">
              <button
                type="submit"
                className="rounded-md bg-[#3F37C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E299A] disabled:opacity-60"
                disabled={loading}
              >
                {loading
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                  ? "Create meeting"
                  : "Save changes"}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
