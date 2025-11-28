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
import { type Member } from "@scrubin/schemas";

// NEW: dialog + input/button imports for role editing
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// NEW: extend Member with roleId and name parts used in the UI
type TeamMember = Member & {
    roleId?: number | null;
    firstName?: string;
    lastName?: string;
	isAdmin?: boolean;
};

export default function TeamPage() {
    const { id: workspaceId } = useParams<{ id: string }>();
    const { getToken } = useAuth();
    const API = process.env.NEXT_PUBLIC_API_BASE_URL as string;

    // CHANGED: use TeamMember instead of Member
    const [members, setMembers] = useState<TeamMember[]>([]);

    // Tracks if that member has a toggled (expanded) row, showing email, phone and remove
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

                // CHANGED: map backend DTO → TeamMember, preserving roleId, first/last
                const mapped: TeamMember[] = (data.members ?? []).map((m: any) => ({
                    id: String(m.id),
                    // Member.name used elsewhere; keep it
                    name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed",
                    role: m.role ?? "Member",
                    email: m.email ?? "",
                    phone: m.phone ?? "",
                    roleId: m.roleId ?? null,
                    firstName: m.firstName ?? "",
                    lastName: m.lastName ?? "",
					isAdmin: m.isAdmin ?? false,
                }));
                if (alive) setMembers(mapped);
            } catch (err) {
                if (alive) setError(err instanceof Error ? err.message : "Failed to load team");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [API, workspaceId, getToken]);

    //Toggle function to switch the setExpanded for true to false and vice versa
    function toggle(id: string) {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    }

    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        member: TeamMember | null; // CHANGED: TeamMember
    }>({ open: false, member: null });

    function openConfirm(member: TeamMember) {
        setConfirmState({ open: true, member });
    }

    function closeConfirm() {
        setConfirmState({ open: false, member: null });
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
                setMembers((prev) => prev.filter((m) => m.id !== id));
            } catch {
                // optional: surface an error
            } finally {
                closeConfirm();
            }
        })();
    }

    const apiClient = createApiClient({
        baseUrl: API,
        getToken,
    });

    const [invitationLink, setInvitationLink] = useState("");
    const [addOpen, setAddOpen] = useState(false);

    const handleOpen = async () => {
        const inv = await apiClient.createInvitation({
            workspaceId: Number(workspaceId),
        });
        setInvitationLink(`${window.location.origin}/invitations/${inv.id}`);
        setAddOpen(true);
    };

    // State for role editing dialog
    const [roleDialogMember, setRoleDialogMember] = useState<TeamMember | null>(null);
    const [roleInput, setRoleInput] = useState("");
    const [roleSaving, setRoleSaving] = useState(false);
    const [roleError, setRoleError] = useState<string | null>(null);

    function openRoleDialog(member: TeamMember) {
        setRoleDialogMember(member);
        setRoleInput(member.role ?? "Member");
        setRoleError(null);
    }

    function closeRoleDialog() {
        setRoleDialogMember(null);
        setRoleInput("");
        setRoleError(null);
    }

    async function saveRole() {
        if (!roleDialogMember) return;
        const newRole = roleInput.trim();
        if (!newRole) {
            setRoleError("Role cannot be empty.");
            return;
        }

        try {
            setRoleSaving(true);
            setRoleError(null);
            const token = await getToken();

            // If user has no roleId yet → create role + membership
            if (roleDialogMember.roleId == null) {
                const res = await fetch(`${API}/workspaces/${workspaceId}/roles`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token ?? ""}`,
                    },
                    body: JSON.stringify({
                        name: newRole,
                        userId: roleDialogMember.id,
                    }),
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const data = await res.json();
                const newRoleId: number | null =
                    data.role?.id != null ? Number(data.role.id) : null;

                // Update local member with new role + roleId
                setMembers((prev) =>
                    prev.map((m) =>
                        m.id === roleDialogMember.id
                            ? { ...m, role: newRole, roleId: newRoleId }
                            : m,
                    ),
                );
            } else {
                // User already has a role → just update the role name
                const res = await fetch(
                    `${API}/workspaces/${workspaceId}/roles/${roleDialogMember.roleId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token ?? ""}`,
                        },
                        body: JSON.stringify({ name: newRole }),
                    },
                );
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                // No need to change roleId; just update the label locally
                setMembers((prev) =>
                    prev.map((m) =>
                        m.id === roleDialogMember.id ? { ...m, role: newRole } : m,
                    ),
                );
            }

            closeRoleDialog();
        } catch (err) {
            setRoleError(
                err instanceof Error ? err.message : "Failed to update role",
            );
        } finally {
            setRoleSaving(false);
        }
    }

    return (
        <main className="p-6 max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                    <UsersRound />
                    <h1 className="text-2xl font-semibold text-gray-700">
                        Team
                    </h1>
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
                    <colgroup>
                        <col className="w-1/2" />
                        <col className="w-5/12" />
                        <col className="w-1/12" />
                    </colgroup>
                    <thead className="bg-gray-300">
                        <tr className="border-b border-gray-400">
                            <th className="p-3 text-gray-800">Name</th>
                            <th className="p-3 text-gray-800">Role</th>
                            <th className="p-3"></th>
                        </tr>
                        {members.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="p-6 text-center text-gray-500 bg-white"
                                >
                                    No team members yet. Click{" "}
                                    <span className="font-semibold">
                                        Add member
                                    </span>{" "}
                                    to invite someone.
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
                                        {/* CHANGED: use firstName/lastName from TeamMember (now set in mapping) */}
                                        <td className="p-3">
                                            {m.firstName} {m.lastName}
                                        </td>

                                        {/* CHANGED: role is now clickable to edit */}
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => openRoleDialog(m)}
                                                className="text-left underline-offset-2 hover:underline"
                                            >
                                                {m.role ?? "Member"}
                                            </button>
                                        </td>

                                        <td className="p-3">
                                            <div className="flex justify-end pr-1">
                                                <button
                                                    type="button"
                                                    onClick={() => toggle(m.id)}
                                                    title={
                                                        isOpen
                                                            ? "Collapse details"
                                                            : "Expand details"
                                                    }
                                                    className="inline-flex items-center rounded-md px-2 py-1 hover:bg-gray-200"
                                                >
                                                    {isOpen ? (
                                                        <ChevronUp
                                                            size={18}
                                                            className="text-gray-700"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <ChevronDown
                                                            size={18}
                                                            className="text-gray-700"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr
                                            id={detailsRowId}
                                            className="border-t border-gray-300 "
                                        >
                                            {/* Email */}
                                            <td className="p-3">
                                                <div className="text-sm font-medium text-gray-500">
                                                    Email:{" "}
                                                    <span className="font-normal">
                                                        {m.email}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Phone */}
                                            <td className="p-3">
                                                <div className="text-sm font-medium text-gray-500">
                                                    Phone:{" "}
                                                    <span className="font-normal">
                                                        {m.phone}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Remove Button */}
                                            <td className="p-3">
                                                <div className="flex justify-end pr-1">
                                                    <AlertDialog
                                                        open={
                                                            confirmState.open
                                                        }
                                                        onOpenChange={(o) =>
                                                            !o &&
                                                            closeConfirm()
                                                        }
                                                    >
                                                        <AlertDialogTrigger asChild>
															<button
																type="button"
																onClick={() => openConfirm(m)}
																disabled={m.isAdmin}   // <- NEW
																title={m.isAdmin ? "Cannot remove workspace admin" : undefined}
																className="inline-flex items-center rounded-lg px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
															>
																<div className="text-white">
																	Remove
																</div>
															</button>
														</AlertDialogTrigger>

                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="font-bold">
                                                                    Remove{" "}
                                                                    {
                                                                        confirmState.member?.firstName
                                                                    }{" "}
                                                                    {
                                                                        confirmState.member?.lastName
                                                                    }
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription className="text-gray-700">
                                                                    This will
                                                                    remove this
                                                                    user from
                                                                    your team.
                                                                    You cannot
                                                                    undo this
                                                                    action.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>

                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel
                                                                    onClick={
                                                                        closeConfirm
                                                                    }
                                                                    className="hover:border-blue-500"
                                                                >
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={
                                                                        confirmRemove
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    <div className="text-white">
                                                                        Confirm
                                                                        remove
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

            {/* NEW: Role edit dialog */}
            <Dialog
                open={!!roleDialogMember}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRoleDialog();
                    }
                }}
            >
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>
                            Edit role{" "}
                            {roleDialogMember
                                ? `for ${roleDialogMember.firstName ?? ""} ${
                                      roleDialogMember.lastName ?? ""
                                  }`.trim()
                                : ""}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2">
                        <label
                            htmlFor="role-input"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Role
                        </label>
                        <Input
                            id="role-input"
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            placeholder="e.g. Receptionist, Vet Assistant, Manager"
                        />
                        {roleError && (
                            <p className="text-sm text-red-600">
                                {roleError}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeRoleDialog}
                            disabled={roleSaving}
							className="hover:border-blue-500"
                        >
                            Cancel
                        </Button>
						<div className="text-white">
                        <Button onClick={saveRole} disabled={roleSaving} className="bg-[#3F37C9] hover:bg-[#2E299A]">
                            {roleSaving ? "Saving…" : "Save"}
                        </Button>
						</div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}