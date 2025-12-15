import express from 'express'
import { prisma } from '../db.js'

import type { Request } from 'express'
const router = express.Router({ mergeParams: true })

// Status mapping between DB ints and API strings
const STATUS = {
    pending: 0,
    approved: 1,
    denied: 2,
} as const

type StatusKey = keyof typeof STATUS

function statusToString(code: number): StatusKey {
    switch (code) {
        case STATUS.approved:
            return 'approved'
        case STATUS.denied:
            return 'denied'
        case STATUS.pending:
        default:
            return 'pending'
    }
}

function statusFromQuery(s: string | undefined): number | undefined {
    if (!s) return undefined
    if (s === 'pending' || s === 'approved' || s === 'denied') {
        return STATUS[s]
    }
    return undefined
}

function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function fullName(user: { firstName: string | null; lastName: string | null } | null) {
    if (!user) return 'Unknown'
    const first = user.firstName ?? ''
    const last = user.lastName ?? ''
    const joined = `${first} ${last}`.trim()
    return joined || 'Unknown'
}

/**
 * GET /workspaces/:workspaceId/timeoff-requests
 * Returns { requests: AnyRequest[] } but only "timeoff" kinds.
 */
router.get('/', async (req: Request<{ workspaceId: string }>, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)

        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const statusCode = statusFromQuery(req.query.status as string | undefined)

        const where: any = { workspaceId }
        if (typeof statusCode === 'number') {
            where.status = statusCode
        }

        const rows = await prisma.timeOffRequest.findMany({
            where,
            orderBy: { id: 'desc' },
            include: { user: true },
        })

        const requests = rows.map((row) => {
            return {
                id: String(row.id),
                status: statusToString(row.status),
                kind: 'timeoff' as const,
                requesterNames: [fullName(row.user)],
                dateRange: {
                    start: formatDate(row.startDate),
                    end: formatDate(row.endDate),
                },
                // reason could be added later if you add a column
            }
        })

        return res.status(200).json({ requests })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to load time off requests' })
    }
})

/**
 * GET /workspaces/:workspaceId/timeoff-requests/:id
 * Returns a single timeoff request (same shape).
 */
router.get('/:id', async (req: Request<{workspaceId: string; id: string}>, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const row = await prisma.timeOffRequest.findFirst({
            where: { id, workspaceId },
            include: { user: true },
        })

        if (!row) {
            return res.status(404).json({ error: 'Time off request not found' })
        }

        const request = {
            id: String(row.id),
            status: statusToString(row.status),
            kind: 'timeoff' as const,
            requesterNames: [fullName(row.user)],
            dateRange: {
                start: formatDate(row.startDate),
                end: formatDate(row.endDate),
            },
        }

        return res.status(200).json({ request })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to load time off request' })
    }
})

/**
 * POST /workspaces/:workspaceId/timeoff-requests
 * TODO: Implement create time off request
 */
router.post('/', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)

        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const { userId, startDate, endDate } = req.body

        // Validation
        if (!userId || !startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Missing required fields: userId, startDate, endDate' 
            })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' })
        }

        if (start > end) {
            return res.status(400).json({ 
                error: 'Start date must be before or equal to end date' 
            })
        }

        // Verify user exists and belongs to workspace
        // CORRECTED: Use 'UserWorkspaceMembership' (the actual field name in schema)
        const user = await prisma.user.findFirst({
            where: { 
                id: userId,
                UserWorkspaceMembership: {
                    some: { workspaceId }
                }
            }
        })

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found or not a member of this workspace' 
            })
        }

        // Create the time off request
        const newRequest = await prisma.timeOffRequest.create({
            data: {
                workspaceId,
                userId,
                startDate: start,
                endDate: end,
                status: STATUS.pending,
            },
            include: { user: true },
        })

        const request = {
            id: String(newRequest.id),
            status: statusToString(newRequest.status),
            kind: 'timeoff' as const,
            requesterNames: [fullName(newRequest.user)],
            dateRange: {
                start: formatDate(newRequest.startDate),
                end: formatDate(newRequest.endDate),
            },
        }

        return res.status(201).json({ request })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to create time off request' })
    }
})

/**
 * PATCH /workspaces/:workspaceId/timeoff-requests/:id
 * TODO: Implement update time off request
 */
router.patch('/:id', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const { startDate, endDate } = req.body

        // Check if request exists
        const existing = await prisma.timeOffRequest.findFirst({
            where: { id, workspaceId },
        })

        if (!existing) {
            return res.status(404).json({ error: 'Time off request not found' })
        }

        // Only allow updates to pending requests
        if (existing.status !== STATUS.pending) {
            return res.status(400).json({ 
                error: 'Cannot update time off request that has already been approved or denied' 
            })
        }

        const updateData: any = {}

        if (startDate) {
            const start = new Date(startDate)
            if (Number.isNaN(start.getTime())) {
                return res.status(400).json({ error: 'Invalid start date format' })
            }
            updateData.startDate = start
        }

        if (endDate) {
            const end = new Date(endDate)
            if (Number.isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid end date format' })
            }
            updateData.endDate = end
        }

        // Validate date range if both are being updated or one is being updated
        const finalStartDate = updateData.startDate || existing.startDate
        const finalEndDate = updateData.endDate || existing.endDate

        if (finalStartDate > finalEndDate) {
            return res.status(400).json({ 
                error: 'Start date must be before or equal to end date' 
            })
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' })
        }

        const updated = await prisma.timeOffRequest.update({
            where: { id },
            data: updateData,
            include: { user: true },
        })

        const request = {
            id: String(updated.id),
            status: statusToString(updated.status),
            kind: 'timeoff' as const,
            requesterNames: [fullName(updated.user)],
            dateRange: {
                start: formatDate(updated.startDate),
                end: formatDate(updated.endDate),
            },
        }

        return res.status(200).json({ request })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to update time off request' })
    }
})

/**
 * DELETE /workspaces/:workspaceId/timeoff-requests/:id
 * TODO: Implement delete time off request
 */
router.delete('/:id', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const existing = await prisma.timeOffRequest.findFirst({
            where: { id, workspaceId },
        })

        if (!existing) {
            return res.status(404).json({ error: 'Time off request not found' })
        }

        // Optional: Only allow deletion of pending requests
        if (existing.status !== STATUS.pending) {
            return res.status(400).json({ 
                error: 'Cannot delete time off request that has already been approved or denied' 
            })
        }

        await prisma.timeOffRequest.delete({
            where: { id },
        })

        return res.status(204).send()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to delete time off request' })
    }
})

/**
 * POST /workspaces/:workspaceId/timeoff-requests/:id/approve
 * Marks time off request as approved.
 */
router.post('/:id/admin/approve', async (req: Request<{ workspaceId: string; id: string }>, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const existing = await prisma.timeOffRequest.findFirst({
            where: { id, workspaceId },
        })

        if (!existing) {
            return res.status(404).json({ error: 'Time off request not found' })
        }

        await prisma.timeOffRequest.update({
            where: { id },
            data: { status: STATUS.approved },
        })

        return res.status(204).send()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to approve time off request' })
    }
})

/**
 * POST /workspaces/:workspaceId/timeoff-requests/:id/reject
 * Marks time off request as denied.
 */
router.post('/:id/admin/reject', async (req: Request<{ workspaceId: string; id: string }>, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' })
        }

        const existing = await prisma.timeOffRequest.findFirst({
            where: { id, workspaceId },
        })

        if (!existing) {
            return res.status(404).json({ error: 'Time off request not found' })
        }

        await prisma.timeOffRequest.update({
            where: { id },
            data: { status: STATUS.denied },
        })

        return res.status(204).send()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        return res.status(500).json({ error: 'Failed to reject time off request' })
    }
})

export default router
