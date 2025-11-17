import express from 'express';
import { prisma } from '../db';
import { listMembers, removeMember } from '../controllers/memberController';

const router = express.Router({ mergeParams: true });

router.get('/', listMembers);

router.get('/:userId/shifts', async (req, res) => {
	// TODO: Implement get user shifts
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:userId/memberships', async (req, res) => {
	// TODO: Implement get memberships by user
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:userId/role-memberships', async (req, res) => {
	// TODO: Implement get role memberships by user
	res.status(501).json({ error: 'Not implemented' });
});

// Helpers duplicated from shiftRequests router to keep DTO consistent
const STATUS = {
	pending: 0,
	approved: 1,
	denied: 2,
} as const;
type StatusKey = keyof typeof STATUS;
function statusToString(code: number): StatusKey {
	switch (code) {
		case STATUS.approved:
			return 'approved';
		case STATUS.denied:
			return 'denied';
		case STATUS.pending:
		default:
		 return 'pending';
	}
}
function statusFromQuery(s: string | undefined): number | undefined {
	if (!s) return undefined;
	if (s === 'pending' || s === 'approved' || s === 'denied') {
		return STATUS[s];
	}
	return undefined;
}
function formatDate(d: Date) {
	return d.toISOString().slice(0, 10);
}
function formatTime(d: Date) {
	return d.toISOString().slice(11, 16);
}
function fullName(user: { firstName: string | null; lastName: string | null } | null) {
	if (!user) return 'Unknown';
	const first = user.firstName ?? '';
	const last = user.lastName ?? '';
	const joined = `${first} ${last}`.trim();
	return joined || 'Unknown';
}

// Get shift requests for a user within a workspace.
// Query params:
// - direction: "incoming" | "outgoing" (optional; if omitted returns both)
// - status: "pending" | "approved" | "denied" (optional)
router.get('/:userId/shift-requests', async (req, res) => {
	try {
		const workspaceId = Number((req.params as any).workspaceId);
		const userId = Number(req.params.userId);
		const direction = (req.query.direction as string | undefined)?.toLowerCase();

		if (!workspaceId || Number.isNaN(workspaceId) || !userId || Number.isNaN(userId)) {
			return res.status(400).json({ error: 'Invalid workspace or user id' });
		}

		// Build where clause
		let where: any = { workspaceId };

		if (direction === 'incoming') {
			where.requestedUserId = userId;
		} else if (direction === 'outgoing') {
			where.requestorId = userId;
		} else {
			// default: requests where the user is involved either way
			where.OR = [{ requestedUserId: userId }, { requestorId: userId }];
		}

		const rows = await prisma.shiftRequest.findMany({
			where,
			orderBy: { id: 'desc' },
		});

		// Collect shift IDs
		const shiftIds = new Set<number>();
		for (const r of rows) {
			shiftIds.add(r.lendedShiftId);
			if (r.requestedShiftId != null) shiftIds.add(r.requestedShiftId);
		}
		const shiftIdList = Array.from(shiftIds);
		const shifts = shiftIdList.length
			? await prisma.shift.findMany({
					where: { id: { in: shiftIdList } },
					include: { user: true },
			  })
			: [];
		const shiftById = new Map<number, (typeof shifts)[number]>();
		for (const s of shifts) shiftById.set(s.id, s);

		const requests = rows
			.map((row) => {
				const lended = shiftById.get(row.lendedShiftId);
				const requested = row.requestedShiftId ? shiftById.get(row.requestedShiftId) : null;
				if (!lended) return null;

				const base = {
					id: String(row.id),
					requestedApproval:
						(typeof (row as any).approvedByRequested === 'string'
							? ((row as any).approvedByRequested as string).toLowerCase()
							: 'pending'),
					managerApproval:
						(typeof (row as any).approvedByManager === 'string'
							? ((row as any).approvedByManager as string).toLowerCase()
							: null),
					// expose who is who for client-side labeling if needed
					requestorId: row.requestorId,
					requestedUserId: row.requestedUserId,
				};

				if (!requested) {
					return {
						...base,
						kind: 'timeoff' as const,
						requesterNames: [fullName(lended.user)],
						dateRange: {
							start: formatDate(lended.startTime),
							end: formatDate(lended.endTime),
						},
					};
				}

				return {
					...base,
					kind: 'trade' as const,
					from: {
						name: fullName(lended.user),
						date: formatDate(lended.startTime),
						start: formatTime(lended.startTime),
						end: formatTime(lended.endTime),
					},
					to: {
						name: fullName(requested.user),
						date: formatDate(requested.startTime),
						start: formatTime(requested.startTime),
						end: formatTime(requested.endTime),
					},
				};
			})
			.filter((r) => r !== null);

		return res.status(200).json({ requests });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		return res.status(500).json({ error: 'Failed to load shift requests by user' });
	}
});

router.post('/', async (req, res) => {
	// TODO: Implement add member to workspace
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:userId', removeMember);

export default router;

