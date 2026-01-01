"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { useSSEStream } from "@/hooks/useSSE";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import {
	Plus,
} from "lucide-react";
import MeetingModal, { MeetingForModal } from "@/components/MeetingModal";
import MeetingsList from "@/components/MeetingsList";
import MeetingDetails from "@/components/MeetingDetails";
import { Meeting, MeetingStatus } from "@scrubin/schemas";

export default function MeetingRequestsPage() {
	const { getToken } = useAuth();
	const { id: workspaceId } = useParams<{ id: string }>();
	const apiClient = useApiClient();

	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [selectedId, setSelectedId] = useState<number>();

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const selected = useMemo(
		() => meetings.find((m) => m.id === selectedId) ?? null,
		[meetings, selectedId]
	);

	const [editorOpen, setEditorOpen] = useState(false);
	const [editorMeeting, setEditorMeeting] = useState<MeetingForModal | null>(null);

	const [reloadToken, setReloadToken] = useState(0);

	const refreshMeetings = useCallback(() => {
		setReloadToken((t) => t + 1);
	}, []);

	useSSEStream(Number(workspaceId), useMemo(() => ({
		'meeting-updated': () => refreshMeetings(),
	}), [refreshMeetings]));

	useEffect(() => {
		let alive = true;

		(async () => {
			setLoading(true);
			setError(null);

			try {
				const data = await apiClient.getMeetingsByWorkspace(workspaceId);

				if (!alive) return;
				setMeetings(data.meetings);
				setSelectedId((prev) => prev || data.meetings[0]?.id || "");
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

	async function deleteMeeting(meetingId: number) {
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
				`Failed to delete meeting${err instanceof Error ? `: ${err.message}` : ""
				}`
			);
		}
	}

	async function applyStatusChange(meetingId: number, status: MeetingStatus) {

		const path = status === "FINALIZED" ? "finalize" : "cancel";
		try {

			await apiClient.updateMeetingStatus(workspaceId, meetingId, path);

			setMeetings((prev) =>
				prev.map((m) =>
					m.id === meetingId ? { ...m, status: status } : m
				)
			);
		} catch (err) {
			setError(
				`Failed to ${status === "FINALIZED" ? "Finalize" : "Cancel"} meeting${err instanceof Error ? `: ${err.message}` : ""
				}`
			);
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
							<MeetingsList
								meetings={meetings}
								onSelect={(id) => setSelectedId(id)}
								selectedId={selectedId}
								onDelete={(id) => deleteMeeting(id)}
							/>
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
						<MeetingDetails
							selected={selected}
							onReschedule={() => {
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
							onStatusChange={(meetingId, status) => applyStatusChange(meetingId, status)}
						/>
					)}
				</section>
			</div>

			<MeetingModal
				open={editorOpen}
				meeting={editorMeeting}
				onClose={() => setEditorOpen(false)}
				onSaved={refreshMeetings}
			/>
		</main>

	);
}
