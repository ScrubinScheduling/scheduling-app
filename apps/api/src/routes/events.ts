import express from 'express'
import { prisma } from '../db.js'
import type { Response } from 'express'

import { randomUUID } from 'crypto'
import { getAuth } from '@clerk/express'

type Client = {
    res: Response
    workspaceId: number | null
    userId: string
    isAdmin: boolean
}

type SEEMessage = {
    type: string
    payload?: unknown
}

const router = express.Router({ mergeParams: true })

// Maps to hold open connections
const clients = new Map<string, Client>()
const workspaceMembershipsSubscriptions = new Map<number, Set<string>>()

function addClient(clientId: string, client: Client) {
    clients.set(clientId, client)

    if (client.workspaceId != null) {
        let set = workspaceMembershipsSubscriptions.get(client.workspaceId)
        if (!set) {
            set = new Set()
            workspaceMembershipsSubscriptions.set(client.workspaceId, set)
        }
        set.add(clientId)
    }
}

function removeClient(clientId: string) {
    const client = clients.get(clientId)
    if (!client) return

    if (client.workspaceId != null) {
        const set = workspaceMembershipsSubscriptions.get(client.workspaceId)
        if (set) {
            set.delete(clientId)
            if (set?.size === 0) {
                workspaceMembershipsSubscriptions.delete(client.workspaceId)
            }
        }
    }
    clients.delete(clientId)
}

// Helper function to write
function sendEvent(client: Client, message: SEEMessage) {
    client.res.write(`data: ${JSON.stringify(message)}\n\n`)
}

// Used for abastaction
function broadcastToWorkspace(workspaceId: number, message: SEEMessage) {
    const ids = workspaceMembershipsSubscriptions.get(workspaceId)
    if (!ids) return

    for (const clientId of ids) {
        const client = clients.get(clientId)
        if (!client) continue
        sendEvent(client, message)
    }
}

function broadCastToUser(userId: string, message: SEEMessage) {
    const data = `data: ${JSON.stringify(message)}\n\n`
    for (const client of clients.values()) {
        if (client.userId !== userId) continue
        client.res.write(data)
    }
}

router.get('/stream', async (req, res) => {
    try {
        const { userId, isAuthenticated } = getAuth(req)
        let workspaceId: number | null = null

        if (!userId) return res.status(404).json({ error: 'User not found' })
        if (!isAuthenticated) return res.status(401).json({ error: 'User is not authenticated' })

        if (req.query.workspaceId != null) {
            const isNumber = Number(req.query.workspaceId)
            if (Number.isInteger(isNumber)) workspaceId = isNumber
        }

        let isAdmin = false

        if (workspaceId != null) {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { adminId: true },
            })

            if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

            isAdmin = workspace.adminId === userId
        }

        // Send headers with status code
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        })
        res.flushHeaders()

        res.write(':\n\n')

        const clientId = randomUUID()
        console.log(clientId)

        addClient(clientId, {
            res,
            userId,
            workspaceId,
            isAdmin,
        })

        req.on('close', () => {
            removeClient(clientId)
            res.end()
        })
    } catch (error) {
        console.log(error)
    }
})

export function emitUpdateShift(workspaceId: number) {
    broadcastToWorkspace(workspaceId, {
        type: 'shift-updated',
    })
}

export function emitWorkspaceCreated(userId: string) {
    broadCastToUser(userId, {
        type: 'workspace-created',
    })
}

export function emitUpdateMeetings(workspaceId: number) {
    broadcastToWorkspace(workspaceId, {
        type: 'meeting-updated',
    })
}

export default router
