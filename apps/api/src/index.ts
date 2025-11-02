import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db'
import { clerkMiddleware, getAuth } from '@clerk/express'
import { verifyWebhook } from '@clerk/express/webhooks'
import { getWorkspaceMembership } from './utils/authz'
import { randomUUID } from 'node:crypto'

const app = express()

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))
app.use(clerkMiddleware())

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

app.post('/dummy-setup', async (req, res) => {
    const { userId, location = 'Canada', roleName = 'DummyAdmin', permissions = 0 } = req.body
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create User
            const user = userId
                ? await tx.user.findUnique({ where: { id: Number(userId) } })
                : await tx.user.create({ data: { clerkId: `dummy-${randomUUID()}` } })

            if (!user) {
                return { status: 404, error: `User ${userId} not found` }
            }

            // Create Workspace
            const workspace = await tx.workspace.create({
                data: {
                    adminId: user.id,
                    location,
                },
            })

            // Create Role
            const role = await tx.role.create({
                data: {
                    name: roleName,
                    permissions,
                    workspaceId: workspace.id,
                },
            })

            // Create Workspace Membership
            await tx.userWorkspaceMembership.create({
                data: {
                    userId: user.id,
                    workspaceId: workspace.id,
                },
            })

            // Create Role Membership
            await tx.userRoleMembership.create({
                data: {
                    userId: user.id,
                    workSpaceId: workspace.id,
                    roleId: role.id,
                },
            })

            // Full User
            const fullUser = await tx.user.findUnique({
                where: { id: user.id },
                include: {
                    UserWorkspaceMembership: { include: { workspace: true } },
                    UserRoleMembership: { include: { role: true, workspace: true } },
                },
            })

            return { status: 201, payload: { user: fullUser, workspace, role } }
        })

        if ('error' in result) return res.status(result.status).json({ error: result.error })
        return res.status(result.status).json(result.payload)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' })
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

app.post('/clerk/webhook', async (req, res) => {
    const evt = await verifyWebhook(req)
    const { id } = evt.data

    if (evt.type === 'user.created') {
        await prisma.user.create({
            data: {
                clerkId: id,
            },
        })
    }
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
})
