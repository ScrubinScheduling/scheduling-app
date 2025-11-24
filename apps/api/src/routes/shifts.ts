import express from 'express'
import { prisma } from '../db'
import { Request, Response } from 'express'
const router = express.Router({ mergeParams: true })

router.get(
    '/',
    async (
        req: Request<{ workspaceId: string }, any, any, { start?: string; end?: string }>,
        res: Response,
    ) => {
        try {
            const workspaceId = Number(req.params.workspaceId)
            const { start, end } = req.query
            if (!Number.isInteger(workspaceId))
                return res.status(400).json({ message: 'Invalid workspaceId' })
            if (!start || !end) return res.status(400).json({ message: 'Missing start or end' })

            const startDate = new Date(start)
            const endDate = new Date(end)

            const shifts = await prisma.shift.findMany({
                where: { workspaceId, startTime: { lt: endDate }, endTime: { gt: startDate } },
                orderBy: { startTime: 'asc' },
                include: { 
                    user: { select: { id: true, firstName: true, lastName: true } },
                    timesheet: true,
                },
            })

            // build day list, assume start and end are midnight boundaries in workspace tz already
            const days: string[] = []
            for (
                let d = new Date(startDate);
                d < endDate;
                d = new Date(d.getTime() + 24 * 3600 * 1000)
            ) {
                days.push(d.toISOString().slice(0, 10)) // yyyy-mm-dd
            }

            // bucket: { [userId]: { [yyyy-mm-dd]: Shift[] } }
            const buckets: Record<number, Record<string, any[]>> = {}
            const users: Record<
                number,
                { id: number; firstName: string | null; lastName: string | null }
            > = {}

            for (const s of shifts) {
                users[s.user.id] = users[s.user.id] ?? s.user
                const sStart = s.startTime.getTime()
                const sEnd = s.endTime.getTime()

                for (const day of days) {
                    const dayStart = new Date(day + 'T00:00:00.000Z').getTime()
                    const dayEnd = dayStart + 24 * 3600 * 1000
                    if (sStart < dayEnd && sEnd > dayStart) {
                        buckets[s.userId] ??= {}
                        buckets[s.userId][day] ??= []
                        // trim payload to what UI needs
                        buckets[s.userId][day].push({
                            id: s.id,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            breakDuration: s.breakDuration,
                        })
                    }
                }
            }

            // response shaped for cheap rendering
            res.json({ days, users: Object.values(users), buckets })
        } catch (error) {
            console.log('Error in shifts route', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },
)

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: 'Invalid shift id' })
        }

        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                timesheet: true,
            },
        })

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' })
        }

        res.status(200).json(shift)
    } catch (error) {
        console.log('Error in get shift route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/', async (req, res) => {
    try {
        const { workspaceId, user, shifts, breakDuration } = req.body

        // Reject invalid ISO strings
        const rows = shifts.map(
            ({ startTime, endTime }: { startTime: string; endTime: string }) => {
                const start = new Date(startTime)
                const end = new Date(endTime)

                // Ensure the shift ends after it starts
                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
                    throw new Error('Invalid ISO time')
                if (end <= start) throw new Error('endTime must be after startTime')

                // Return DB-ready shape
                return {
                    userId: user,
                    workspaceId: workspaceId,
                    breakDuration: Number(breakDuration) || 30,
                    startTime: start,
                    endTime: end,
                }
            },
        )

        const result = await prisma.shift.createMany({ data: rows })
        console.log(result.count)
        res.status(201).json({ inserted: result.count })
    } catch (error) {
        console.log('Error in shifts route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid Id' })

        const shift = await prisma.shift.findUnique({ where: { id: id } })

        if (!shift) return res.status(404).json({ error: `shift: ${id} was not found` })

        const { startTime, endTime, userId, breakDuration } = req.body as {
            startTime?: string
            endTime?: string
            userId?: string
            breakDuration?: number
        }

        const updateData: any = {}
        if (startTime !== undefined) updateData.startTime = new Date(startTime)
        if (endTime !== undefined) updateData.endTime = new Date(endTime)
        if (breakDuration !== undefined) updateData.breakDuration = breakDuration
        if (userId !== undefined) updateData.userId = userId

        // Overlap check with other shifts
        const nextStart = startTime ? new Date(startTime) : shift.startTime
        const nextEnd = endTime ? new Date(endTime) : shift.endTime
        const nextUserId = userId ?? shift.userId

        if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()))
            return res.status(400).json({ error: 'Invalid ISO time' })
        if (nextEnd <= nextStart)
            return res.status(400).json({ error: 'endTime must be after startTime' })

        const conflict = await prisma.shift.findFirst({
            where: {
                workspaceId: shift.workspaceId,
                userId: nextUserId,
                id: { not: id },
                startTime: { lt: nextEnd },
                endTime: { gt: nextStart },
            },
        })

        if (conflict) return res.status(409).json({ error: 'Shift overlaps with another shift' })

        const updated = await prisma.shift.update({
            where: { id: id },
            data: updateData,
        })

        return res.status(200).json(updated)
    } catch (error) {
        console.log('Error in shifts route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
        await prisma.shift.delete({ where: { id: Number(id) } })

        res.status(200).json({ message: 'Shift deleted' })
    } catch (err) {
        console.log('Error in shifts route', err)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/:id/clock-in', async (req, res) => {
    try {
        const shiftId = Number(req.params.id)
        if (!Number.isInteger(shiftId)) {
            return res.status(400).json({ error: 'Invalid shift id' })
        }

        // Verify shift exists
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' })
        }

        // Get clock-in time from request body or use current time
        const clockInTime = req.body?.at ? new Date(req.body.at) : new Date()

        // Upsert timesheet (create if doesn't exist, update if it does)
        const timesheet = await prisma.timesheet.upsert({
            where: { shiftId },
            update: {
                clockInTime,
            },
            create: {
                shiftId,
                clockInTime,
            },
            include: {
                shift: true,
            },
        })

        res.status(200).json(timesheet)
    } catch (error) {
        console.log('Error in clock-in route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/:id/clock-out', async (req, res) => {
    try {
        const shiftId = Number(req.params.id)
        if (!Number.isInteger(shiftId)) {
            return res.status(400).json({ error: 'Invalid shift id' })
        }

        // Verify shift exists
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' })
        }

        // Get clock-out time from request body or use current time
        const clockOutTime = req.body?.at ? new Date(req.body.at) : new Date()

        // Update timesheet (create if doesn't exist)
        const timesheet = await prisma.timesheet.upsert({
            where: { shiftId },
            update: {
                clockOutTime,
            },
            create: {
                shiftId,
                clockOutTime,
            },
            include: {
                shift: true,
            },
        })

        res.status(200).json(timesheet)
    } catch (error) {
        console.log('Error in clock-out route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/:id/break/start', async (req, res) => {
    try {
        const shiftId = Number(req.params.id)
        if (!Number.isInteger(shiftId)) {
            return res.status(400).json({ error: 'Invalid shift id' })
        }

        // Verify shift exists
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' })
        }

        // Get break start time from request body or use current time
        const startBreakTime = req.body?.at ? new Date(req.body.at) : new Date()

        // Update timesheet (create if doesn't exist)
        const timesheet = await prisma.timesheet.upsert({
            where: { shiftId },
            update: {
                startBreakTime,
            },
            create: {
                shiftId,
                startBreakTime,
            },
            include: {
                shift: true,
            },
        })

        res.status(200).json(timesheet)
    } catch (error) {
        console.log('Error in start break route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/:id/break/end', async (req, res) => {
    try {
        const shiftId = Number(req.params.id)
        if (!Number.isInteger(shiftId)) {
            return res.status(400).json({ error: 'Invalid shift id' })
        }

        // Verify shift exists
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' })
        }

        // Get break end time from request body or use current time
        const endBreakTime = req.body?.at ? new Date(req.body.at) : new Date()

        // Update timesheet (create if doesn't exist)
        const timesheet = await prisma.timesheet.upsert({
            where: { shiftId },
            update: {
                endBreakTime,
            },
            create: {
                shiftId,
                endBreakTime,
            },
            include: {
                shift: true,
            },
        })

        res.status(200).json(timesheet)
    } catch (error) {
        console.log('Error in end break route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

export default router
