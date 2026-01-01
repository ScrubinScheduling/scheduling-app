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

import dayjs, { Dayjs } from "dayjs";

import { Member } from "@scrubin/schemas";
import { dateTimeToISO } from "@/lib/utils";
import { useApiClient } from "@/hooks/useApiClient";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";


export type MeetingForModal = {
	id: number;
	location: string;
	description: string;
	date: string;
	time: string;                // "HH:MM"
	inviteMembershipIds: number[];
	createdById: string;         // User.id (Clerk)
};


export default function MeetingModal({
	open,
	meeting,
	onClose,
	onSaved,
}: {
	open: boolean;
	meeting?: MeetingForModal | null;
	onClose: () => void;
	onSaved: () => void;
}) {

	const isEditing = !!meeting;
	const { userId: currentUserId } = useAuth();
	const { id: workspaceId } = useParams<{ id: string }>();

	const [location, setLocation] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
	const [time, setTime] = React.useState<Dayjs | null>(null);
	const [selectedMemberIds, setSelectedMemberIds] = React.useState<number[]>([]);
	const [members, setMembers] = React.useState<Member[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const apiClient = useApiClient();

	// Fetch workspace members when modal opens
	React.useEffect(() => {
		if (!open) return;

		(async () => {
			try {
				setError(null);
				const data = await apiClient.getWorkspaceMembers(workspaceId);

				// Clerk user id of the creator
				const creatorUserId =
					isEditing && meeting ? meeting.createdById : currentUserId;

				const filtered: Member[] = data.members.filter((m: Member) =>
					creatorUserId ? String(m.id) !== String(creatorUserId) : true
				);

				setMembers(filtered);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load members"
				);
			}
		})();
	}, [open, workspaceId, isEditing, meeting, currentUserId]);

	// Initialize form when opening / switching meeting
	React.useEffect(() => {
		if (!open) return;

		if (isEditing && meeting) {
			setLocation(meeting.location ?? "");
			setDescription(meeting.description ?? "");
			setSelectedMemberIds(meeting.inviteMembershipIds);

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
	}, [open, isEditing, meeting]);

	function toggleMember(id: number) {
		setSelectedMemberIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const scheduledAt = dateTimeToISO(selectedDate, time);
		if (!scheduledAt) {
			setError("Please provide a valid date and time.");
			return;
		}

		try {
			setLoading(true);

			const data = {
				location,
				description,
				scheduledAt,
				inviteMembershipIds: selectedMemberIds
					.map((id) => Number(id))
					.filter((n) => !Number.isNaN(n)),
			};
			if (!isEditing) {
				await apiClient.createMeeting(workspaceId, data)
			} else {
				if (!meeting?.id) {
					setError("Missing meeting id.");
					return;
				}
				apiClient.rescheduleMeeting(workspaceId, meeting.id, data)
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
						{!isEditing ? "Create meeting" : "Reschedule meeting"}
					</DialogTitle>
					<DialogDescription>
						{!isEditing
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
						<DateSelector selectedDate={selectedDate}
							onSelect={(d) => setSelectedDate(d ?? null)}
						/>

						<TimeSelector time={time} onTimeChange={(val) => setTime(val)}/>
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
												checked={selectedMemberIds.includes(m.membershipId)}
												onChange={() => toggleMember(m.membershipId)}
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
									? !isEditing
										? "Creating..."
										: "Saving..."
									: !isEditing
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
