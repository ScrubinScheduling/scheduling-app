import express from 'express'
import { prisma } from '../db.js'

const router = express.Router({ mergeParams: true })

function getWorkspaceId(req: express.Request): number {
    return Number(req.params.workspaceId ?? req.params.id)
}

// GET /workspaces/:workspaceId/role-memberships
// Returns plain membership rows for this workspace
router.get('/', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const memberships = await prisma.userRoleMembership.findMany({
            where: { workSpaceId: workspaceId },
            select: {
                id: true,
                userId: true,
                roleId: true,
                workSpaceId: true,
            },
        })

        return res.status(200).json({ memberships })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching role memberships', err)
        return res.status(500).json({ error: 'Failed to fetch role memberships' })
    }
})

// GET /workspaces/:workspaceId/role-memberships/:id
// Returns a single membership row (no extra user/role fields)
router.get('/:id', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        const membership = await prisma.userRoleMembership.findFirst({
            where: { id, workSpaceId: workspaceId },
            select: {
                id: true,
                userId: true,
                roleId: true,
                workSpaceId: true,
            },
        })

        if (!membership) {
            return res.status(404).json({ error: 'Role membership not found' })
        }

        return res.status(200).json({ membership })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching role membership', err)
        return res.status(500).json({ error: 'Failed to fetch role membership' })
    }
})

// POST /workspaces/:workspaceId/role-memberships
// Ensures exactly one membership per (userId, workSpaceId),
// updating it if it already exists.
router.post('/', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const { userId, roleId } = req.body as {
            userId?: string
            roleId?: number
        }

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'userId is required' })
        }
        if (roleId == null || Number.isNaN(Number(roleId))) {
            return res.status(400).json({ error: 'roleId is required' })
        }

        const numericRoleId = Number(roleId)

        // Role must exist and belong to this workspace
        const role = await prisma.role.findFirst({
            where: { id: numericRoleId, workspaceId },
        })
        if (!role) {
            return res.status(404).json({ error: 'Role not found in workspace' })
        }

        // User must be a member of this workspace
        const userMembership = await prisma.userWorkspaceMembership.findFirst({
            where: { workspaceId, userId },
        })
        if (!userMembership) {
            return res.status(404).json({ error: 'User is not a member of this workspace' })
        }

        // Enforce single membership per (userId, workSpaceId)
        const existing = await prisma.userRoleMembership.findFirst({
            where: { userId, workSpaceId: workspaceId },
        })

        let membership
        if (existing) {
            membership = await prisma.userRoleMembership.update({
                where: { id: existing.id },
                data: { roleId: role.id },
            })
        } else {
            membership = await prisma.userRoleMembership.create({
                data: {
                    userId,
                    workSpaceId: workspaceId,
                    roleId: role.id,
                },
            })
        }

        return res.status(201).json({ membership })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error creating role membership', err)
        return res.status(500).json({ error: 'Failed to create role membership' })
    }
})

// DELETE /workspaces/:workspaceId/role-memberships/:id
// Also deletes the Role if it becomes unused.
router.delete('/:id', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        // Find which role this membership uses
        const membership = await prisma.userRoleMembership.findFirst({
            where: { id, workSpaceId: workspaceId },
        })
        if (!membership) {
            return res.status(404).json({ error: 'Role membership not found' })
        }

        const roleId = membership.roleId

        await prisma.userRoleMembership.delete({
            where: { id },
        })

        // Clean up role if unused
        const count = await prisma.userRoleMembership.count({
            where: { roleId },
        })
        if (count === 0) {
            await prisma.role.deleteMany({
                where: { id: roleId, workspaceId },
            })
        }

        return res.status(204).send()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error deleting role membership', err)
        return res.status(500).json({ error: 'Failed to delete role membership' })
    }
})

export default router
