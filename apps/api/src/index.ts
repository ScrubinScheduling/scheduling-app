import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db'
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express'
import { verifyWebhook } from '@clerk/express/webhooks'
import { getWorkspaceMembership } from './utils/authz'
import workspaceRoutes from './routes/workspaces'

const app = express()

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))
app.use(clerkMiddleware())
app.use(workspaceRoutes)

app.get('/workspaces', async (req, res) => {
    const { userId } = getAuth(req)

    const user = await prisma.user.findFirst({
        where: {
            clerkId: userId,
        },
    })

    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    const workspaces = await prisma.workspace.findMany({
        where: {
            memberships: { some: { user } },
        },
    })

    res.status(200).json({ workspaces })
})

app.get('/workspaces/:id', async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const membership = await getWorkspaceMembership(userId, Number(req.params.id))

        if (!membership) {
            return res.status(403).json({ error: 'Unauthorized to Access Workspace' })
        }

        console.log(membership)

        res.status(200).json(membership.workspace)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err })
    }
})

app.post('/workspaces', async (req, res) => {
    const { userId } = getAuth(req)

    const user = await prisma.user.findFirst({
        where: {
            clerkId: userId,
        },
    })

    if (!user) {
        return res.status(404).json({ error: 'User not found in db' })
    }

    const workspace = await prisma.workspace.create({
        data: {
            name: req.body.name,
            adminId: user.id,
            location: req.body.location,
            memberships: {
                create: [{ user: { connect: { id: user.id } } }],
            },
        },
    })

    res.status(200).json(workspace)
})

app.get('/invitations/:id', async (req, res) => {
    const { isAuthenticated, userId: clerkId } = getAuth(req)

    console.log(clerkId)
    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Unauthenicated' })
    }

    const invitation = await prisma.invitation.findFirst({
        where: {
            id: req.params.id,
        },
    })

    if (!invitation) {
        return res.status(404).json({ error: 'Invitation Not Found' })
    }

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: invitation.workspaceId,
        },
    })

    if (!workspace) {
        return res.status(404).json({ error: 'Workspace Not Found' })
    }

    const user = await prisma.user.findFirst({
        where: {
            id: workspace.adminId,
        },
    })

    if (!user) {
        return res.status(404).json({ error: 'User Not Found' })
    }

    const { fullName, primaryEmailAddress } = await clerkClient.users.getUser(clerkId)

    res.status(200).json({
        workspaceName: workspace.name,
        workspaceOwnerName: fullName,
        workspaceOwnerEmail: primaryEmailAddress?.emailAddress,
        invitationId: invitation.id,
    })
})

app.post('/invitations/:id/accept', async (req, res) => {
    const { id: invitationId } = req.params
    const { userId } = getAuth(req)

    const invitation = await prisma.invitation.findFirst({
        where: {
            id: invitationId,
        },
    })

    if (!invitation) {
        return res.status(404).json({ error: 'Invitation not Found' })
    }

    const membership = await prisma.userWorkspaceMembership.create({
        data: {
            user: { connect: { clerkId: userId } },
            workspace: { connect: { id: invitation.workspaceId } },
        },
    })

    res.status(200).json(membership)

    await prisma.invitation.delete({
        where: {
            id: invitation.id,
        },
    })
})

app.post('/clerk/webhook', async (req, res) => {
    const evt = await verifyWebhook(req)
    const { id, first_name, last_name } = evt.data
    if (evt.type === 'user.created') {
        await prisma.user.create({
            data: {
                firstName: first_name,
                lastName: last_name,
                clerkId: id,
            },
        })
    }
})

/*
  Will need checks in the future for duplicate shifts.
  If userId is switched as well need to check for duplicates.
*/
app.put('/shift/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invlaid Id' })

        const shift = await prisma.shift.findUnique({ where: { id: id } })

        if (!shift) return res.status(404).json({ error: `shift: ${id} was not found` })

        const { startTime, endTime, userId, breakDuration } = req.body as {
            startTime: string
            endTime: string
            userId: number
            breakDuration: number
        }

        if (!startTime || !endTime || !userId || !breakDuration) {
            return res.status(400).json({ error: 'Not all feilds were provided' })
        }

        // Could do an additional check to see if userId breakDuration or workSpaceId are integers

        const updated = await prisma.shift.update({
            where: { id: id },
            data: {
                startTime,
                endTime,
                breakDuration,
            },
        })

        return res.status(200).json({ updated })
    } catch (error) {
        console.log('Error in index route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})



app.post('/dummy-create-shift', async (req, res) => {
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
                    workspaceId: Number(workspaceId),
                    breakDuration: Number(breakDuration) || 30,
                    startTime: start,
                    endTime: end,
                }
            },
        )

        const result = await prisma.shift.createMany({ data: rows })
        console.log(result.count)
        res.status(201).json({ inserted: result.count })
    } catch (err) {
        console.log('Error in index route', err)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

/*
    Needs more saftey checks
*/
app.delete('/shift/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
        await prisma.shift.delete({ where: { id: Number(id) } })

        res.status(200).json({ message: 'Shift deleted' })
    } catch (err) {
        console.log('Error in index route', err)
        res.status(500).json({ message: 'Internal server error' })
    }
})

app.get('/get-users/:workspaceId', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        if (!Number.isInteger(workspaceId))
            return res.status(400).json({ message: 'Invalid workspace Id' })

        // Find users
        const users = await prisma.user.findMany({
            where: {
                UserWorkspaceMembership: {
                    some: { workspaceId },
                },
            },
            include: {
                UserWorkspaceMembership: {
                    where: { workspaceId },
                    // include: { workspace: true },
                },
            },
        })

        if (!users) return res.status(404).json({ error: 'No users found' }); 
        return res.status(200).json({users}); 


        return users
    } catch (error) {}
})

app.get('/shifts/:workspaceId', async (req, res) => {
    try {
        const workspaceId = Number(req.params.workspaceId)
        const { start, end } = req.body
        if (!Number.isInteger(workspaceId))
            return res.status(400).json({ message: 'Invalid workspaceId' })

        const startDate = new Date(start)
        const endDate = new Date(end)

        const shifts = await prisma.shift.findMany({
            where: { workspaceId, startTime: { lt: endDate }, endTime: { gt: startDate } },
            orderBy: { startTime: 'asc' },
            include: { user: true },
        })

        res.status(200).json(shifts)
    } catch (error) {
        console.log('Error in index route', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
})
