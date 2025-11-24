import express from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../db';
import { getWorkspaceMembership } from '../utils/authz';

const router = express.Router({ mergeParams: true });

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toISOString().slice(11, 16);
}

/**
 * Utility: parse workspaceId and meetingId from route params safely.
 */
function parseWorkspaceId(req: express.Request): number | null {
	const params = req.params as { workspaceId?: string; id?: string };
	const raw = params.workspaceId;
	if (!raw) return null;
	const n = Number(raw);
	return Number.isNaN(n) ? null : n;
}

function parseMeetingId(req: express.Request): number | null {
	const params = req.params as { id?: string };
	const raw = params.id;
	if (!raw) return null;
	const n = Number(raw);
	return Number.isNaN(n) ? null : n;
}

/**
 * Utility: shape meeting + invitations into the front-end format
 * expected by your Meeting Requests page.
 */
function mapMeetingForResponse(meeting: any) {
  const yes: string[] = [];
  const no: string[] = [];
  const pending: string[] = [];
  const inviteMembershipIds: number[] = [];

  for (const invite of meeting.invitations ?? []) {
    const user = invite.membership?.user;
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.email ||
      "Unnamed";

    inviteMembershipIds.push(invite.membershipId); // requires MeetingInvite.membershipId

    switch (invite.response) {
      case "YES":
        yes.push(name);
        break;
      case "NO":
        no.push(name);
        break;
      default:
        pending.push(name);
    }
  }

  const d: Date = meeting.scheduledAt;

  return {
    id: meeting.id,
    location: meeting.location,
    description: meeting.description,
    date: formatDate(d),   // "Nov 21, 2025"
    time: formatTime(d),   // e.g. "10:00"
    status: meeting.status,
    inviteMembershipIds,
	createdById: meeting.createdById,
    attendees: {
      yes,
      no,
      pending,
    },
  };
}


/**
 * GET /workspaces/:workspaceId/meetings
 * List meetings for a workspace (for members of that workspace).
 */
router.get('/', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);

		if (!workspaceId) {
			return res.status(400).json({ error: 'Invalid workspaceId' });
		}

		// Ensure the caller is a member of this workspace
		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const meetings = await prisma.meeting.findMany({
			where: { workspaceId },
			orderBy: { scheduledAt: 'asc' },
			include: {
				invitations: {
					include: {
						membership: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		const shaped = meetings.map(mapMeetingForResponse);
		return res.json({ meetings: shaped });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('GET /meetings error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * GET /workspaces/:workspaceId/meetings/:id
 * Get a single meeting by id.
 */
router.get('/:id', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);
		const meetingId = parseMeetingId(req);

		if (!workspaceId || !meetingId) {
			return res.status(400).json({ error: 'Invalid workspaceId or meeting id' });
		}

		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const meeting = await prisma.meeting.findFirst({
			where: { id: meetingId, workspaceId },
			include: {
				invitations: {
					include: {
						membership: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		if (!meeting) {
			return res.status(404).json({ error: 'Meeting not found' });
		}

		return res.json({ meeting: mapMeetingForResponse(meeting) });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('GET /meetings/:id error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * POST /workspaces/:workspaceId/meetings
 * Create a meeting.
 *
 * Expected body:
 * {
 *   "location": string,
 *   "description": string,
 *   "scheduledAt": string (ISO),
 *   "inviteMembershipIds": number[] // UserWorkspaceMembership IDs to invite
 * }
 */
router.post('/', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);

		if (!workspaceId) {
			return res.status(400).json({ error: 'Invalid workspaceId' });
		}

		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const { location, description, scheduledAt, inviteMembershipIds } = req.body as {
			location?: string;
			description?: string;
			scheduledAt?: string;
			inviteMembershipIds?: unknown;
		};

		if (!location || !scheduledAt) {
			return res
				.status(400)
				.json({ error: 'location and scheduledAt are required' });
		}

		const scheduledDate = new Date(scheduledAt);
		if (Number.isNaN(scheduledDate.getTime())) {
			return res.status(400).json({ error: 'scheduledAt must be a valid date' });
		}

		let inviteIds: number[] = [];
		if (Array.isArray(inviteMembershipIds)) {
			inviteIds = inviteMembershipIds
				.map((v) => Number(v))
				.filter((n) => !Number.isNaN(n));
		}

		// Only allow inviting memberships from this workspace
		const validMemberships = await prisma.userWorkspaceMembership.findMany({
			where: {
				id: { in: inviteIds },
				workspaceId,
			},
			select: { id: true },
		});

		const validMembershipIds = validMemberships.map((m) => m.id);

		const created = await prisma.meeting.create({
			data: {
				workspaceId,
				// NOTE: assuming Meeting.createdById is an Int FK to User.id
				createdById: membership.userId,
				location,
				description: description ?? '',
				scheduledAt: scheduledDate,
				invitations: {
					create: validMembershipIds.map((membershipId) => ({ membershipId })),
				},
			},
			include: {
				invitations: {
					include: {
						membership: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		return res.status(201).json({ meeting: mapMeetingForResponse(created) });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('POST /meetings error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * DELETE /workspaces/:workspaceId/meetings/:id
 * Delete a meeting.
 */
router.delete('/:id', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);
		const meetingId = parseMeetingId(req);

		if (!workspaceId || !meetingId) {
			return res.status(400).json({ error: 'Invalid workspaceId or meeting id' });
		}

		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const existing = await prisma.meeting.findFirst({
			where: { id: meetingId, workspaceId },
		});

		if (!existing) {
			return res.status(404).json({ error: 'Meeting not found' });
		}

		// Cascade delete invitations via relation in schema (if configured),
		// or explicitly delete them here.
		await prisma.meetingInvite.deleteMany({
			where: { meetingId },
		});

		await prisma.meeting.delete({
			where: { id: meetingId },
		});

		return res.status(204).send();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('DELETE /meetings/:id error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * POST /workspaces/:workspaceId/meetings/:id/finalize
 * Set meeting status → FINALIZED.
 */
router.post('/:id/finalize', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);
		const meetingId = parseMeetingId(req);

		if (!workspaceId || !meetingId) {
			return res.status(400).json({ error: 'Invalid workspaceId or meeting id' });
		}

		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const existing = await prisma.meeting.findFirst({
			where: { id: meetingId, workspaceId },
		});

		if (!existing) {
			return res.status(404).json({ error: 'Meeting not found' });
		}

		const updated = await prisma.meeting.update({
			where: { id: meetingId },
			data: { status: 'FINALIZED' },
			include: {
				invitations: {
					include: {
						membership: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		return res.json({ meeting: mapMeetingForResponse(updated) });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('POST /meetings/:id/finalize error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * POST /workspaces/:workspaceId/meetings/:id/cancel
 * Set meeting status → CANCELLED.
 */
router.post('/:id/cancel', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const workspaceId = parseWorkspaceId(req);
		const meetingId = parseMeetingId(req);

		if (!workspaceId || !meetingId) {
			return res.status(400).json({ error: 'Invalid workspaceId or meeting id' });
		}

		const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
		if (!membership) {
			return res.status(403).json({ error: 'Not a member of this workspace' });
		}

		const existing = await prisma.meeting.findFirst({
			where: { id: meetingId, workspaceId },
		});

		if (!existing) {
			return res.status(404).json({ error: 'Meeting not found' });
		}

		const updated = await prisma.meeting.update({
			where: { id: meetingId },
			data: { status: 'CANCELLED' },
			include: {
				invitations: {
					include: {
						membership: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		});

		return res.json({ meeting: mapMeetingForResponse(updated) });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('POST /meetings/:id/cancel error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

router.post("/:id/reschedule", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const workspaceId = parseWorkspaceId(req);
    const meetingId = parseMeetingId(req);

    if (!workspaceId || !meetingId) {
      return res
        .status(400)
        .json({ error: "Invalid workspaceId or meeting id" });
    }

    const membership = await getWorkspaceMembership(userId ?? null, workspaceId);
    if (!membership) {
      return res
        .status(403)
        .json({ error: "Not a member of this workspace" });
    }

    const existing = await prisma.meeting.findFirst({
      where: { id: meetingId, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const { location, description, scheduledAt, inviteMembershipIds } =
      req.body as {
        location?: string;
        description?: string;
        scheduledAt?: string;
        inviteMembershipIds?: unknown;
      };

    if (!location || !scheduledAt) {
      return res
        .status(400)
        .json({ error: "location and scheduledAt are required" });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res
        .status(400)
        .json({ error: "scheduledAt must be a valid date" });
    }

    let inviteIds: number[] = [];
    if (Array.isArray(inviteMembershipIds)) {
      inviteIds = inviteMembershipIds
        .map((v) => Number(v))
        .filter((n) => !Number.isNaN(n));
    }

    // Filter to memberships in this workspace
    const validMemberships = await prisma.userWorkspaceMembership.findMany({
      where: {
        id: { in: inviteIds },
        workspaceId,
      },
      select: { id: true },
    });

    const newIds = validMemberships.map((m) => m.id);

    const existingInvites = await prisma.meetingInvite.findMany({
      where: { meetingId },
      select: { membershipId: true },
    });

    const existingIds = existingInvites.map((i) => i.membershipId);

    const toRemove = existingIds.filter((id) => !newIds.includes(id));
    const toAdd = newIds.filter((id) => !existingIds.includes(id));
    const toReset = existingIds.filter((id) => newIds.includes(id));

    await prisma.$transaction([
      // Update core meeting fields
      prisma.meeting.update({
        where: { id: meetingId },
        data: {
          location,
          description: description ?? "",
          scheduledAt: scheduledDate,
        },
      }),
      // Remove invites not in new selection
      prisma.meetingInvite.deleteMany({
        where: {
          meetingId,
          membershipId: { in: toRemove },
        },
      }),
      // Reset responses to pending for kept invites
      prisma.meetingInvite.updateMany({
        where: {
          meetingId,
          membershipId: { in: toReset },
        },
        data: {
          response: "PENDING",
          respondedAt: null,
        },
      }),
      // Add new invites
      ...toAdd.map((membershipId) =>
        prisma.meetingInvite.create({
          data: {
            meetingId,
            membershipId,
          },
        })
      ),
    ]);

    const updated = await prisma.meeting.findFirst({
      where: { id: meetingId, workspaceId },
      include: {
        invitations: {
          include: {
            membership: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!updated) {
      return res.status(500).json({ error: "Failed to load updated meeting" });
    }

    return res.json({ meeting: mapMeetingForResponse(updated) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("POST /meetings/:id/reschedule error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
