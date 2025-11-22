import express from 'express'
import { prisma } from '../db'

const router = express.Router({ mergeParams: true })

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date) {
    // HH:MM
    return d.toISOString().slice(11, 16)
}

function fullName(user: { firstName: string | null; lastName: string | null } | null) {
    if (!user) return 'Unknown'
    const first = user.firstName ?? ''
    const last = user.lastName ?? ''
    const joined = `${first} ${last}`.trim()
    return joined || 'Unknown'
}

function computeStatus(row: { approvedByRequested: string; approvedByManager: string | null }) {
    const req = (row.approvedByRequested || '').toUpperCase()
    const mgr = (row.approvedByManager || '').toUpperCase()
    if (req === 'DENIED' || mgr === 'DENIED') return 'denied' as const
    if (req === 'APPROVED' && mgr === 'APPROVED') return 'approved' as const
    return 'pending' as const
}

router.get('/', async (req, res) => {
    try {
        const workspaceId = Number((req.params as any).workspaceId)

        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const statusFilter = (req.query.status as string | undefined)?.toLowerCase()
        const where: any = { workspaceId }

        if (statusFilter === 'approved') {
            where.AND = [
                { approvedByRequested: 'APPROVED' },
                { approvedByManager: 'APPROVED' },
            ]
        } else if (statusFilter === 'denied') {
            where.OR = [
                { approvedByRequested: 'DENIED' },
                { approvedByManager: 'DENIED' },
            ]
        } else if (statusFilter === 'pending') {
            // Manager pending: requested user has approved, manager not decided yet
            where.AND = [
                { approvedByRequested: 'APPROVED' },
                { OR: [{ approvedByManager: null }, { approvedByManager: 'PENDING' }] },
            ]
        }

        const rows = await prisma.shiftRequest.findMany({
            where,
            orderBy: { id: 'desc' },
            })

            // collect shift ids
            const shiftIds = new Set<number>()
            const requestedUserIds = new Set<string>()
            for (const r of rows) {
            shiftIds.add(r.lendedShiftId)
            if (r.requestedShiftId != null) {
                shiftIds.add(r.requestedShiftId)
            }
            if (r.requestedUserId) {
                requestedUserIds.add(r.requestedUserId)
            }
            }

            const shiftIdList = Array.from(shiftIds)
            const shifts = shiftIdList.length
            ? await prisma.shift.findMany({
                where: { id: { in: shiftIdList } },
                include: { user: true },
                })
            : []

            const requestedUsers = requestedUserIds.size
            ? await prisma.user.findMany({
                where: { id: { in: Array.from(requestedUserIds) } },
                })
            : []

            const shiftById = new Map<number, (typeof shifts)[number]>()
            for (const s of shifts) {
            shiftById.set(s.id, s)
            }

            const userById = new Map<string, (typeof requestedUsers)[number]>()
            for (const u of requestedUsers) {
            userById.set(u.id, u)
            }

            const requests = rows
            .map((row) => {
                const lended = shiftById.get(row.lendedShiftId)
                const requested = row.requestedShiftId
                ? shiftById.get(row.requestedShiftId)
                : null

                if (!lended) {
                return null
                }

                const base = {
                id: String(row.id),
                status: computeStatus(row),
                }

                if (!requested) {
                // COVER REQUEST: one shift, second person is requestedUser
                const coverer = userById.get(row.requestedUserId)
                return {
                    ...base,
                    kind: 'cover' as const,
                    from: {
                    name: fullName(lended.user),
                    date: formatDate(lended.startTime),
                    start: formatTime(lended.startTime),
                    end: formatTime(lended.endTime),
                    },
                    coverer: {
                    name: fullName(coverer ?? null),
                    },
                }
                }

                // TRADE REQUEST: two shifts
                const fromUser = lended.user
                const toUser = requested.user

                return {
                ...base,
                kind: 'trade' as const,
                from: {
                    name: fullName(fromUser),
                    date: formatDate(lended.startTime),
                    start: formatTime(lended.startTime),
                    end: formatTime(lended.endTime),
                },
                to: {
                    name: fullName(toUser),
                    date: formatDate(requested.startTime),
                    start: formatTime(requested.startTime),
                    end: formatTime(requested.endTime),
                },
                }
            })
            .filter((r) => r !== null)

        return res.status(200).json({ requests })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to load shift requests' })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const workspaceId = Number((req.params as any).workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const row = await prisma.shiftRequest.findFirst({
            where: { id, workspaceId },
        })

        if (!row) {
            return res.status(404).json({ error: 'Shift request not found' })
        }

        const shiftIds = [row.lendedShiftId]
        if (row.requestedShiftId != null) shiftIds.push(row.requestedShiftId)

        const shifts = await prisma.shift.findMany({
            where: { id: { in: shiftIds } },
            include: { user: true },
        })

        const shiftById = new Map<number, (typeof shifts)[number]>()
        for (const s of shifts) shiftById.set(s.id, s)

        const lended = shiftById.get(row.lendedShiftId)
        const requested = row.requestedShiftId ? shiftById.get(row.requestedShiftId) : null

        if (!lended) {
        return res.status(500).json({ error: 'Inconsistent shift request data' })
        }

        const base = {
        id: String(row.id),
        status: computeStatus(row),
        }

        let requestDto: any

        if (!requested) {
        // COVER REQUEST
        const coverer = await prisma.user.findUnique({
            where: { id: row.requestedUserId },
        })

        requestDto = {
            ...base,
            kind: 'cover' as const,
            from: {
            name: fullName(lended.user),
            date: formatDate(lended.startTime),
            start: formatTime(lended.startTime),
            end: formatTime(lended.endTime),
            },
            coverer: {
            name: fullName(coverer),
            },
        }
        } else {
        // TRADE REQUEST
        requestDto = {
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
        }
        }

        return res.status(200).json({ request: requestDto })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to load shift request' })
    }
})

router.post('/', async (req, res) => {
    // TODO: Implement create shift request
    res.status(501).json({ error: 'Not implemented' })
})

router.patch('/:id', async (req, res) => {
    // TODO: Implement update shift request
    res.status(501).json({ error: 'Not implemented' })
})

router.delete('/:id', async (req, res) => {
    // TODO: Implement delete shift request
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/:id/admin/approve', async (req, res) => {
    try {
        const workspaceId = Number((req.params as any).workspaceId);
        const id = Number(req.params.id);

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
        }

        // Load the request so we know what kind it is
        const existing = await prisma.shiftRequest.findFirst({
        where: { id, workspaceId },
        });

        if (!existing) {
        return res.status(404).json({ error: 'Shift request not found' });
        }

        // Safety: only allow manager approval once the requested user has approved
        if (existing.approvedByRequested !== 'APPROVED') {
        return res
            .status(409)
            .json({ error: 'Requested user has not approved this request yet' });
        }

        // If manager already decided, avoid double-applying the swap
        if (existing.approvedByManager === 'APPROVED') {
        return res.status(409).json({ error: 'Shift request already approved' });
        }
        if (existing.approvedByManager === 'DENIED') {
        return res.status(409).json({ error: 'Shift request already denied' });
        }

        // Fetch the involved shift(s)
        const lendedShift = await prisma.shift.findUnique({
        where: { id: existing.lendedShiftId },
        });

        if (!lendedShift) {
        return res
            .status(500)
            .json({ error: 'Lended shift not found for this request' });
        }

        let requestedShift = null;
        if (existing.requestedShiftId != null) {
        requestedShift = await prisma.shift.findUnique({
            where: { id: existing.requestedShiftId },
        });
        if (!requestedShift) {
            return res
            .status(500)
            .json({ error: 'Requested shift not found for this request' });
        }
        }

        // Optional consistency checks (can be removed if you don’t care)
        if (lendedShift.userId !== existing.requestorId) {
        return res.status(409).json({
            error: 'Lended shift is no longer owned by the requestor',
        });
        }
        if (requestedShift && requestedShift.userId !== existing.requestedUserId) {
        return res.status(409).json({
            error: 'Requested shift is no longer owned by the requested user',
        });
        }

        // At this point:
        // - If requestedShift is null  => COVER REQUEST
        // - If requestedShift exists   => TRADE REQUEST

        if (!requestedShift) {
        // COVER: move lendedShift to requestedUserId
        await prisma.$transaction([
            prisma.shift.update({
            where: { id: existing.lendedShiftId },
            data: { userId: existing.requestedUserId },
            }),
            prisma.shiftRequest.update({
            where: { id },
            data: { approvedByManager: 'APPROVED' },
            }),
        ]);
        } else {
        // TRADE: swap the owners of the two shifts
        await prisma.$transaction([
            prisma.shift.update({
            where: { id: existing.lendedShiftId },
            data: { userId: existing.requestedUserId },
            }),
            prisma.shift.update({
            where: { id: existing.requestedShiftId! },
            data: { userId: existing.requestorId },
            }),
            prisma.shiftRequest.update({
            where: { id },
            data: { approvedByManager: 'APPROVED' },
            }),
        ]);
        }

        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to approve shift request' });
    }
});


router.post('/:id/admin/reject', async (req, res) => {
    try {
        const workspaceId = Number((req.params as any).workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' })
        }

        const existing = await prisma.shiftRequest.findFirst({
        where: { id, workspaceId },
        })
        if (!existing) {
        return res.status(404).json({ error: 'Shift request not found' })
        }

        await prisma.shiftRequest.update({
        where: { id },
        data: { approvedByManager: 'DENIED' },
        })

        return res.status(204).send()
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Failed to reject shift request' })
    }
})

export default router
