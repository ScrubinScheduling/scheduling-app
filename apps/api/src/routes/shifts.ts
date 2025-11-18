import express from 'express'
import { prisma } from '../db'

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const { start, end } = req.query as { start?: string; end?: string }
        if (!Number.isInteger(workspaceId))
            return res.status(400).json({ message: 'Invalid workspaceId' })
        if (!start || !end) return res.status(400).json({ message: 'Missing start or end' })

        const startDate = new Date(start)
        const endDate = new Date(end)

        const shifts = await prisma.shift.findMany({
            where: { workspaceId, startTime: { lt: endDate }, endTime: { gt: startDate } },
            orderBy: { startTime: 'asc' },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
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
})

router.get('/:id', async (req, res) => {
    // TODO: Implement get single shift
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/', async (req, res) => {
    try {
        const { workspaceId, employee /* should be userId */, shifts, breakDuration } = req.body
        /*
     		Need checks on variables workspaceId, userId(employee for right now), breakDuration
    	*/

        const rows = shifts.map(
            ({ startTime, endTime }: { startTime: string; endTime: string }) => {
                const start = new Date(startTime)
                const end = new Date(endTime)

                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
                    throw new Error('Invalid ISO time')
                if (end <= start) throw new Error('endTime must be after startTime')

                return {
                    userId: employee,
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
            userId?: number
            breakDuration?: number
        }

        const updateData: any = {}
        if (startTime !== undefined) updateData.startTime = new Date(startTime)
        if (endTime !== undefined) updateData.endTime = new Date(endTime)
        if (breakDuration !== undefined) updateData.breakDuration = breakDuration
        if (userId !== undefined) updateData.userId = userId

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
    // TODO: Implement clock in
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/:id/clock-out', async (req, res) => {
    // TODO: Implement clock out
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/:id/break/start', async (req, res) => {
    // TODO: Implement start break
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/:id/break/end', async (req, res) => {
    // TODO: Implement end break
    res.status(501).json({ error: 'Not implemented' })
})

export default router
