import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db.js'
import { clerkMiddleware } from '@clerk/express'
import { verifyWebhook } from '@clerk/express/webhooks'

import usersRouter from './routes/users.js'
import workspacesRouter from './routes/workspaces.js'
import permissionsRouter from './routes/permissions.js'
import shiftsRouter from './routes/shifts.js'
import invitationsRouter from './routes/invitations.js'
import workspaceUsersRouter from './routes/workspaceUsers.js'
import workspaceMembershipsRouter from './routes/workspaceMemberships.js'
import rolesRouter from './routes/roles.js'
import roleMembershipsRouter from './routes/roleMemberships.js'
import shiftRequestsRouter from './routes/shiftRequests.js'
import meetingsRouter from './routes/meetings.js'
import timeOffRequestsRouter from './routes/timeOffRequests.js'
import timesheetsRouter from './routes/timesheets.js'
import eventsRouter from './routes/events.js'

const app = express()
const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:3000']
app.use(helmet())
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true) // native/mobile (no Origin)
            if (allowedOrigins.includes(origin)) return callback(null, true)
            return callback(new Error('Not allowed by CORS'))
        },
        credentials: true,
    }),
)
app.use(express.json())
app.use(morgan('dev'))
app.use(clerkMiddleware())

app.use('/users', usersRouter)
app.use('/workspaces', workspacesRouter)
app.use('/permissions', permissionsRouter)
app.use('/invitations', invitationsRouter)
app.use('/events', eventsRouter)

// Mount nested workspace routes
app.use('/workspaces/:workspaceId/shifts', shiftsRouter)
app.use('/workspaces/:workspaceId/users', workspaceUsersRouter)
app.use('/workspaces/:workspaceId/memberships', workspaceMembershipsRouter)
app.use('/workspaces/:workspaceId/roles', rolesRouter)
app.use('/workspaces/:workspaceId/role-memberships', roleMembershipsRouter)
app.use('/workspaces/:workspaceId/shift-requests', shiftRequestsRouter)
app.use('/workspaces/:workspaceId/meetings', meetingsRouter)
app.use('/workspaces/:workspaceId/timeoff-requests', timeOffRequestsRouter)
app.use('/workspaces/:workspaceId/timesheets', timesheetsRouter)

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
                id,
                firstName: first_name || null,
                lastName: last_name || null,
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
