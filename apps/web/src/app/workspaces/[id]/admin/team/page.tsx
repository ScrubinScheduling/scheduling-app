"use client";
import {
	UsersRound,
	Plus,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import React, { useState } from "react";
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
import AddMemberModal from "../../../../../../components/AddMemberModal";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";

type Member = {
	id: number,
	name: string,
	role: string,
	email: string,
	phone: string,
}

export default function TeamPage() {
	const { id: workspaceId } = useParams<{ id: string }>();
	const { getToken } = useAuth();
	const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
	const [members, setMembers] = useState<Member[]>([]);

	// Tracks if that member has a toggled (expanded) row, showing email, phone and remove
	const [expanded, setExpanded] = useState<Record<number, boolean>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	
	React.useEffect(() => {
		let alive = true;
		(async () => {
			try {
				setLoading(true);
				const token = await getToken();
				const res = await fetch(`${API}/workspaces/${workspaceId}/users`, {
					headers: { Authorization: `Bearer ${token ?? ""}` },
					cache: "no-store",
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				// Map API → your Member type
				const mapped: Member[] = (data.members ?? []).map((m: any) => ({
					id: Number(m.id),
					name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed",
					role: m.role ?? "Member",
					email: m.email ?? "",
					phone: m.phone ?? "",
				}));
				if (alive) setMembers(mapped);
			} catch (e: any) {
				if (alive) setError(e.message ?? "Failed to load team");
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => { alive = false; };
	}, [API, workspaceId, getToken]);

	//Toggle function to switch the setExpanded for true to false and vice versa
	function toggle(id: number) {
		setExpanded(prev => ({
			...prev,
			[id]: !prev[id],
		}));
	}

	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		member: Member | null;
	}>({ open: false, member: null })

	function openConfirm(member: Member) {
		setConfirmState({ open: true, member })
	}

	function closeConfirm() {
		setConfirmState({ open: false, member: null })
	}

	function confirmRemove() {
		const id = confirmState.member?.id;
		if (id == null) return;
		(async () => {
			try {
				const token = await getToken();
				const res = await fetch(`${API}/workspaces/${workspaceId}/users/${id}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token ?? ""}` },
				});
				if (res.status !== 204 && !res.ok) throw new Error(`HTTP ${res.status}`);
				setMembers(prev => prev.filter(m => m.id !== id));
			} catch {
				// optional: surface an error
			} finally {
				closeConfirm();
			}
		})();
	}
 
	
	const apiClient = createApiClient({
		baseUrl: API,
		getToken
	});
	
	const [invitationLink, setInvitationLink] = useState("")
	const [addOpen, setAddOpen] = useState(false);

	const handleOpen = async () => {
		const inv = await apiClient.createInvitation({
			workspaceId: Number(workspaceId)
		});
		setInvitationLink(`${window.location.origin}/invitations/${inv.id}`);
		setAddOpen(true);
	}
	return (
		<main className="p-6 max-w-6xl mx-auto">
			<header className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2 text-gray-700">
					<UsersRound />
					<h1 className="text-2xl font-semibold text-gray-700">Team</h1>
				</div>
				<div className="text-white">
					<button
						onClick={handleOpen}
						className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-[#3F37C9] hover:bg-[#2E299A]"
					>
						<Plus size={18} /> Add member
					</button>
				</div>
			</header>

			{loading && (
				<div className="p-4 text-gray-500">Loading team…</div>
			)}
			{error && !loading && (
				<div className="p-4 text-red-600">Error: {error}</div>
			)}

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
				inviteLink={invitationLink}
			/>
		</main>
	);
}
