'use client';
import React, { useState } from 'react';
import { UsersRound, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
import AddMemberModal from "@/components/AddMemberModal";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@scrubin/api-client";
import { Member } from "@scrubin/schemas";

// NEW: dialog + input/button imports for role editing
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// NEW: extend Member with roleId and name parts used in the UI
type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  roleId: number | null;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
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
                const mapped: TeamMember[] = (data.members as Member[] ?? []).map((m) => ({
                    id: String(m.id),
                    
                    // Member.name used elsewhere; keep it
                    name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed",
                    role: m.role ?? "Member",
                    email: m.email ?? "",
                    phone: m.phone ?? "",
                    roleId: m.roleId ? Number(m.roleId) : null,
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

	const apiClient = React.useMemo(
		() =>
			createApiClient({
				baseUrl: API,
				getToken,
			}),
		[API, getToken],
	);

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
  const [roleInput, setRoleInput] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  function openRoleDialog(member: TeamMember) {
    setRoleDialogMember(member);
    setRoleInput(member.role ?? 'Member');
    setRoleError(null);
  }

  function closeRoleDialog() {
    setRoleDialogMember(null);
    setRoleInput('');
    setRoleError(null);
  }

  async function saveRole() {
    if (!roleDialogMember) return;
    const newRole = roleInput.trim();
    if (!newRole) {
      setRoleError('Role cannot be empty.');
      return;
    }

    try {
      setRoleSaving(true);
      setRoleError(null);
      const token = await getToken();

      // If user has no roleId yet → create role + membership
      if (roleDialogMember.roleId == null) {
        const res = await fetch(`${API}/workspaces/${workspaceId}/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`
          },
          body: JSON.stringify({
            name: newRole,
            userId: roleDialogMember.id
          })
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const newRoleId: number | null = data.role?.id != null ? Number(data.role.id) : null;

        // Update local member with new role + roleId
        setMembers((prev) =>
          prev.map((m) =>
            m.id === roleDialogMember.id ? { ...m, role: newRole, roleId: newRoleId } : m
          )
        );
      } else {
        // User already has a role → just update the role name
        const res = await fetch(
          `${API}/workspaces/${workspaceId}/roles/${roleDialogMember.roleId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token ?? ''}`
            },
            body: JSON.stringify({ name: newRole })
          }
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        // No need to change roleId; just update the label locally
        setMembers((prev) =>
          prev.map((m) => (m.id === roleDialogMember.id ? { ...m, role: newRole } : m))
        );
      }

      closeRoleDialog();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setRoleSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="text-foreground flex items-center gap-2">
          <UsersRound />
          <h1 className="text-foreground text-2xl font-semibold">Team</h1>
        </div>
        <div>
          <button
            onClick={handleOpen}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <Plus size={18} /> Add member
          </button>
        </div>
      </header>

      {loading && <div className="text-muted-foreground p-4">Loading team…</div>}
      {error && !loading && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          Error: {error}
        </div>
      )}

      <div className="border-border text-muted-foreground overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-5/12" />
            <col className="w-1/12" />
          </colgroup>
          <thead className="bg-muted">
            <tr className="border-border border-b">
              <th className="text-foreground p-3">Name</th>
              <th className="text-foreground p-3">Role</th>
              <th className="p-3"></th>
            </tr>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted-foreground bg-card p-6 text-center">
                  No team members yet. Click <span className="font-semibold">Add member</span> to
                  invite someone.
                </td>
              </tr>
            ) : null}
          </thead>

          <tbody className="bg-card">
            {members.map((m) => {
              const isOpen = expanded[m.id];
              const detailsRowId = `row-${m.id}-details`;

              return (
                <React.Fragment key={m.id}>
                  <tr className="border-border border-t">
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
                        {m.role ?? 'Member'}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-end pr-1">
                        <button
                          type="button"
                          onClick={() => toggle(m.id)}
                          title={isOpen ? 'Collapse details' : 'Expand details'}
                          className="hover:bg-muted inline-flex items-center rounded-md px-2 py-1"
                        >
                          {isOpen ? (
                            <ChevronUp
                              size={18}
                              className="text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                              className="text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr id={detailsRowId} className="border-border border-t">
                      {/* Email */}
                      <td className="p-3">
                        <div className="text-muted-foreground text-sm font-medium">
                          Email: <span className="font-normal">{m.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3">
                        <div className="text-muted-foreground text-sm font-medium">
                          Phone: <span className="font-normal">{m.phone}</span>
                        </div>
                      </td>

                      {/* Remove Button */}
                      <td className="p-3">
                        <div className="flex justify-end pr-1">
                          <AlertDialog
                            open={confirmState.open}
                            onOpenChange={(o) => !o && closeConfirm()}
                          >
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openConfirm(m)}
                                disabled={m.isAdmin} // <- NEW
                                title={m.isAdmin ? 'Cannot remove workspace admin' : undefined}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center rounded-lg px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold">
                                  Remove {confirmState.member?.firstName}{' '}
                                  {confirmState.member?.lastName}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This will remove this user from your team. You cannot undo this
                                  action.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={closeConfirm}
                                  className="hover:border-ring"
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={confirmRemove}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Confirm remove
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

      <AddMemberModal open={addOpen} setOpen={setAddOpen} inviteLink={invitationLink} />

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
              Edit role{' '}
              {roleDialogMember
                ? `for ${roleDialogMember.firstName ?? ''} ${
                    roleDialogMember.lastName ?? ''
                  }`.trim()
                : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="role-input" className="text-foreground block text-sm font-medium">
              Role
            </label>
            <Input
              id="role-input"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="e.g. Receptionist, Vet Assistant, Manager"
            />
            {roleError && <p className="text-destructive text-sm">{roleError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRoleDialog}
              disabled={roleSaving}
              className="hover:border-ring"
            >
              Cancel
            </Button>
            <div>
              <Button
                onClick={saveRole}
                disabled={roleSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {roleSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
