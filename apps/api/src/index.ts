import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db'
import { clerkMiddleware } from '@clerk/express'
import { verifyWebhook } from '@clerk/express/webhooks'

import usersRouter from './routes/users'
import workspacesRouter from './routes/workspaces'
import permissionsRouter from './routes/permissions'
import shiftsRouter from './routes/shifts'
import invitationsRouter from './routes/invitations'
import workspaceUsersRouter from './routes/workspaceUsers'
import workspaceMembershipsRouter from './routes/workspaceMemberships'
import rolesRouter from './routes/roles'
import roleMembershipsRouter from './routes/roleMemberships'
import shiftRequestsRouter from './routes/shiftRequests'
import meetingsRouter from './routes/meetings'

const app = express()

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))
app.use(clerkMiddleware())

app.use('/users', usersRouter)
app.use('/workspaces', workspacesRouter)
app.use('/permissions', permissionsRouter)
app.use('/invitations', invitationsRouter)

// Mount nested workspace routes
app.use('/workspaces/:workspaceId/shifts', shiftsRouter)
app.use('/workspaces/:workspaceId/users', workspaceUsersRouter)
app.use('/workspaces/:workspaceId/memberships', workspaceMembershipsRouter)
app.use('/workspaces/:workspaceId/roles', rolesRouter)
app.use('/workspaces/:workspaceId/role-memberships', roleMembershipsRouter)
app.use('/workspaces/:workspaceId/shift-requests', shiftRequestsRouter)
app.use('/workspaces/:workspaceId/meetings', meetingsRouter)

app.post('/clerk/webhook', async (req, res) => {
    const evt = await verifyWebhook(req)
    const { id, first_name, last_name } = evt.data as {
        id: string
        first_name?: string
        last_name?: string
    }
    if (evt.type === 'user.created') {
        await prisma.user.create({
            data: {
                firstName: first_name || null,
                lastName: last_name || null,
                clerkId: id,
            },
        })
    }
    res.status(200).json({ received: true })
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
})
