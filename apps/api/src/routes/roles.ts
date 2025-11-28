import express from 'express'
import { prisma } from '../db.js'

const router = express.Router({ mergeParams: true })

// Helper to get workspaceId from parent router
function getWorkspaceId(req: express.Request): number {
    return Number(req.params.workspaceId ?? req.params.id)
}

// GET /workspaces/:workspaceId/roles
router.get('/', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        const roles = await prisma.role.findMany({
            where: { workspaceId },
            orderBy: { id: 'asc' },
        })

        return res.status(200).json({ roles })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching roles', err)
        return res.status(500).json({ error: 'Failed to fetch roles' })
    }
})

// GET /workspaces/:workspaceId/roles/:id
router.get('/:id', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        const role = await prisma.role.findFirst({
            where: { id, workspaceId },
        })

        if (!role) {
            return res.status(404).json({ error: 'Role not found' })
        }

        return res.status(200).json({ role })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching role', err)
        return res.status(500).json({ error: 'Failed to fetch role' })
    }
})

// POST /workspaces/:workspaceId/roles
// Body: { name: string, permissions?: number, userId?: string }
// If userId is provided, a UserRoleMembership will be created/updated for that user.
router.post('/', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        if (!workspaceId || Number.isNaN(workspaceId)) {
            return res.status(400).json({ error: 'Invalid workspace id' })
        }

        let { name, permissions, userId } = req.body as {
            name?: string
            permissions?: number
            userId?: string
        }

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' })
        }
        name = name.trim()
        if (!name) {
            return res.status(400).json({ error: 'name cannot be empty' })
        }

        if (permissions == null) permissions = 0

        // Create the role (no uniqueness requirement enforced; if you want
        // unique names per workspace, you can add a unique index and check first)
        const role = await prisma.role.create({
            data: {
                workspaceId,
                name,
                permissions,
            },
        })

        let membership = null

        // If userId is passed, ensure they are a member of this workspace
        // and then create/update their UserRoleMembership.
        if (userId) {
            const userMembership = await prisma.userWorkspaceMembership.findFirst({
                where: { workspaceId, userId },
            })
            if (!userMembership) {
                return res
                    .status(404)
                    .json({ error: 'User is not a member of this workspace' })
            }

            const existing = await prisma.userRoleMembership.findFirst({
                where: { userId, workSpaceId: workspaceId },
            })

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
        }

        return res.status(201).json({ role, membership })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error creating role', err)
        return res.status(500).json({ error: 'Failed to create role' })
    }
})

// PATCH /workspaces/:workspaceId/roles/:id
// Body: { name?: string, permissions?: number }
router.patch('/:id', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        const { name, permissions } = req.body as {
            name?: string
            permissions?: number
        }

        const data: any = {}
        if (typeof name === 'string') {
            const trimmed = name.trim()
            if (!trimmed) {
                return res.status(400).json({ error: 'name cannot be empty' })
            }
            data.name = trimmed
        }
        if (typeof permissions === 'number') {
            data.permissions = permissions
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No fields to update' })
        }

        const role = await prisma.role.updateMany({
            where: { id, workspaceId },
            data,
        })

        if (role.count === 0) {
            return res.status(404).json({ error: 'Role not found' })
        }

        const updated = await prisma.role.findUnique({ where: { id } })
        return res.status(200).json({ role: updated })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error updating role', err)
        return res.status(500).json({ error: 'Failed to update role' })
    }
})

// DELETE /workspaces/:workspaceId/roles/:id
// Also deletes all UserRoleMemberships for this role.
router.delete('/:id', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const id = Number(req.params.id)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        // Remove memberships first
        await prisma.userRoleMembership.deleteMany({
            where: { roleId: id, workSpaceId: workspaceId },
        })

        const deleted = await prisma.role.deleteMany({
            where: { id, workspaceId },
        })

        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Role not found' })
        }

        return res.status(204).send()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error deleting role', err)
        return res.status(500).json({ error: 'Failed to delete role' })
    }
})

// GET /workspaces/:workspaceId/roles/:roleId/members
router.get('/:roleId/members', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const roleId = Number(req.params.roleId)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(roleId)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        const memberships = await prisma.userRoleMembership.findMany({
            where: { workSpaceId: workspaceId, roleId },
            include: {
                user: true,
            },
        })

        const members = memberships.map((m) => ({
            userId: m.userId,
            firstName: m.user.firstName ?? '',
            lastName: m.user.lastName ?? '',
        }))

        return res.status(200).json({ members })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching role members', err)
        return res.status(500).json({ error: 'Failed to fetch role members' })
    }
})

// PUT /workspaces/:workspaceId/roles/:roleId/members/:userId
// Assign user to a role in this workspace. If the user already has a role
// membership in this workspace, update it to this role.
router.put('/:roleId/members/:userId', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const roleId = Number(req.params.roleId)
        const userId = String(req.params.userId)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(roleId)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        const role = await prisma.role.findFirst({
            where: { id: roleId, workspaceId },
        })
        if (!role) {
            return res.status(404).json({ error: 'Role not found in workspace' })
        }

        const membership = await prisma.userWorkspaceMembership.findFirst({
            where: { workspaceId, userId },
        })
        if (!membership) {
            return res.status(404).json({ error: 'User is not a member of this workspace' })
        }

        const existing = await prisma.userRoleMembership.findFirst({
            where: { userId, workSpaceId: workspaceId },
        })

        let userRole
        if (existing) {
            userRole = await prisma.userRoleMembership.update({
                where: { id: existing.id },
                data: { roleId },
            })
        } else {
            userRole = await prisma.userRoleMembership.create({
                data: {
                    userId,
                    workSpaceId: workspaceId,
                    roleId,
                },
            })
        }

        return res.status(200).json({ membership: userRole })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error assigning user to role', err)
        return res.status(500).json({ error: 'Failed to assign user to role' })
    }
})

// DELETE /workspaces/:workspaceId/roles/:roleId/members/:userId
// Remove the role membership; if the role becomes unused, delete the role too.
router.delete('/:roleId/members/:userId', async (req, res) => {
    try {
        const workspaceId = getWorkspaceId(req)
        const roleId = Number(req.params.roleId)
        const userId = String(req.params.userId)

        if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(roleId)) {
            return res.status(400).json({ error: 'Invalid ids' })
        }

        await prisma.userRoleMembership.deleteMany({
            where: { userId, workSpaceId: workspaceId, roleId },
        })

        // Clean up role if now unused
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
        console.error('Error revoking user from role', err)
        return res.status(500).json({ error: 'Failed to revoke user from role' })
    }
})

export default router
