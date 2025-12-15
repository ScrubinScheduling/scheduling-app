import express from 'express'
import { getAuth } from '@clerk/express'
import { clerkClient } from '@clerk/express'
import { prisma } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { workspaceId } = req.query

    if (workspaceId) {
        // Get invitations by workspace
        const invitations = await prisma.invitation.findMany({
            where: {
                workspaceId: Number(workspaceId),
            },
        })
        res.status(200).json(invitations)
    } else {
        // TODO: Implement get all invitations (if needed)
        res.status(501).json({ error: 'Not implemented' })
    }
})

router.get('/:id', async (req, res) => {
    const { isAuthenticated, userId: clerkId } = getAuth(req)

    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Unauthenticated' })
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

    const { fullName, primaryEmailAddress } = await clerkClient.users.getUser(user.id)

    res.status(200).json({
        workspaceName: workspace.name,
        workspaceOwnerName: fullName,
        workspaceOwnerEmail: primaryEmailAddress?.emailAddress,
        invitationId: invitation.id,
    })
})

router.post('/', async (req, res) => {
    const { userId } = getAuth(req)
    const { workspaceId } = req.body

    if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' })
    }

    const user = await prisma.user.findFirst({
        where: {
            id: userId || undefined,
        },
    })

    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: Number(workspaceId),
        },
    })

    if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.adminId === user.id) {
        const invitation = await prisma.invitation.create({
            data: {
                workspaceId: Number(workspaceId),
            },
        })

        res.status(200).json(invitation)
    } else {
        res.status(403).json({ error: 'Unauthorized to create invitations for this workspace' })
    }
})

router.delete('/:id', async (req, res) => {
    // TODO: Implement delete invitation
    res.status(501).json({ error: 'Not implemented' })
})

router.post('/:id/accept', async (req, res) => {
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

    if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
    }

    const membership = await prisma.userWorkspaceMembership.create({
        data: {
            user: { connect: { id: userId } },
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

export default router
