import express from 'express'
import { getAuth } from '@clerk/express'
import { prisma } from '../db.js'
import { getWorkspaceMembership } from '../utils/authz.js'
import { emitWorkspaceCreated } from './events.js'


const router = express.Router()

router.get('/', async (req, res) => {
    const { isAuthenticated, userId } = getAuth(req)

    if (!isAuthenticated) {
        return res.status(401).json({ error: 'User not authenticated' })

    }
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
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

    res.status(200).json(workspaces)
})

router.get('/:id', async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req)

        if (!isAuthenticated) {
            return res.status(401).json({ error: 'User not authenticated' })
    
        }
        const membership = await getWorkspaceMembership(userId, Number(req.params.id))

        if (!membership) {
            return res.status(403).json({ error: 'Unauthorized to Access Workspace' })
        }

        res.status(200).json(membership.workspace) // This is what I changed
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err })
    }
})

router.post('/', async (req, res) => {
    const { isAuthenticated, userId } = getAuth(req)

    if (!isAuthenticated) {
        return res.status(401).json({ error: 'User not authenticated' })

    }
    const user = await prisma.user.upsert({
        where: {
            id: userId,
        },
        update: {},
        create: {
            id: userId,
        },
    })

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

    emitWorkspaceCreated(userId); 
    res.status(200).json(workspace)
})

router.patch('/:id', async (req, res) => {
    // TODO: Implement workspace update
    res.status(501).json({ error: 'Not implemented' })
})

router.delete('/:id', async (req, res) => {
    // TODO: Implement workspace delete
    res.status(501).json({ error: 'Not implemented' })
})

export default router
