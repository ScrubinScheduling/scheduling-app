import express from 'express'
import { prisma } from '../db.js'
import type { Request, Response } from 'express'

const router = express.Router({ mergeParams: true })

router.get(
    '/',
    async (
        req: Request<{ workspaceId: string }, any, any, { start?: string; end?: string }>,
        res,
    ) => {
        try {
            const workspaceId = Number(req.params.workspaceId)

            if (!Number.isInteger(workspaceId))
                return res.status(400).json({ error: 'Invalid param' })

            const { start, end } = req.query

            const where: any = { shift: { workspaceId } }
            if (start && end) {
                const startDate = new Date(start)
                const endDate = new Date(end)

                where.shift.startTime = { lt: endDate }
                where.shift.endTime = { gt: startDate }
            }

            const timesheets = await prisma.timesheet.findMany({
                where,
                include: {
                    shift: {
                        select: {
                            id: true,
                            startTime: true,
                            endTime: true,
                            user: true,
                        },
                    },
                },

                orderBy: { id: 'desc' },
            })

            res.status(200).json(timesheets)
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error fetching user timesheets', err)
            return res.status(500).json({ error: 'Internal server error' })
        }
    },
)

router.get(
    '/users/:userId',
    async (
        req: Request<
            { workspaceId: string; userId: string },
            any,
            any,
            { start?: string; end?: string }
        >,
        res: Response,
    ) => {
        try {
            const workspaceId = Number(req.params.workspaceId)
            const userId = req.params.userId
            if (!Number.isInteger(workspaceId) || !userId)
                return res.status(400).json({ error: 'Invalid params' })

            const { start, end } = req.query
            const where: any = { shift: { workspaceId, userId } }

            if (start && end) {
                const startDate = new Date(start)
                const endDate = new Date(end)
                where.shift.startTime = { lt: endDate }
                where.shift.endTime = { gt: startDate }
            }

            const timesheets = await prisma.timesheet.findMany({
                where,
                include: {
                    shift: {
                        select: {
                            id: true,
                            userId: true,
                            workspaceId: true,
                            startTime: true,
                            endTime: true,
                            breakDuration: true,
                            user: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                },
                orderBy: { id: 'desc' },
            })

            return res.status(200).json(timesheets);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error fetching user timesheets', err)
            return res.status(500).json({ error: 'Internal server error' })
        }
    },
)

/**
 * PATCH /workspaces/:workspaceId/timesheets/:id
 * Update timesheet times (admin only)
 */
router.patch(
    '/:id',
    async (req: Request<{ workspaceId: string; id: string }>, res: Response) => {
        try {
            const workspaceId = Number(req.params.workspaceId)
            const timesheetId = Number(req.params.id)
            
            if (!Number.isInteger(workspaceId) || !Number.isInteger(timesheetId)) {
                return res.status(400).json({ error: 'Invalid id' })
            }

            const { clockInTime, clockOutTime, startBreakTime, endBreakTime } = req.body

            // Verify timesheet exists and belongs to workspace
            const existing = await prisma.timesheet.findFirst({
                where: {
                    id: timesheetId,
                    shift: { workspaceId }
                }
            })

            if (!existing) {
                return res.status(404).json({ error: 'Timesheet not found' })
            }

            // Build update data
            const updateData: any = {}

            if (clockInTime !== undefined) {
                updateData.clockInTime = clockInTime ? new Date(clockInTime) : null
            }
            if (clockOutTime !== undefined) {
                updateData.clockOutTime = clockOutTime ? new Date(clockOutTime) : null
            }
            if (startBreakTime !== undefined) {
                updateData.startBreakTime = startBreakTime ? new Date(startBreakTime) : null
            }
            if (endBreakTime !== undefined) {
                updateData.endBreakTime = endBreakTime ? new Date(endBreakTime) : null
            }

            // Validate times if both clock in and clock out are present
            const finalClockIn = updateData.clockInTime ?? existing.clockInTime
            const finalClockOut = updateData.clockOutTime ?? existing.clockOutTime
            
            if (finalClockIn && finalClockOut && finalClockIn > finalClockOut) {
                return res.status(400).json({ 
                    error: 'Clock in time must be before clock out time' 
                })
            }

            const updated = await prisma.timesheet.update({
                where: { id: timesheetId },
                data: updateData,
                include: {
                    shift: {
                        select: {
                            id: true,
                            userId: true,
                            workspaceId: true,
                            startTime: true,
                            endTime: true,
                            breakDuration: true,
                            user: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                }
            })

            return res.status(200).json(updated)
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error updating timesheet', err)
            return res.status(500).json({ error: 'Internal server error' })
        }
    },
)

export default router;