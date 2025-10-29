import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db'
import { clerkMiddleware, getAuth } from '@clerk/express'
import { verifyWebhook } from '@clerk/express/webhooks'
import { getWorkspaceMembership } from './utils/authz'

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
            return res.status(403).json({ error: 'Unauthorized to Access Workspace' });
        }   

        console.log(membership)

        res.status(200).json(membership.workspace);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err });
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
