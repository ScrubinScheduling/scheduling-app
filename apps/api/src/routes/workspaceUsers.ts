import express from 'express';
import { prisma } from '../db';
import { listMembers, removeMember } from '../controllers/memberController';

const router = express.Router({ mergeParams: true });

router.get('/', listMembers);

// gets shift for a user in a workspace
router.get('/:userId/shifts', async (req, res) => {
	// DONE: Implement get user shifts
	try {
		const workspaceId = Number(req.params.workspaceId);
		const userId = Number(req.params.userId);

		// check for validity
		if (!Number.isInteger(workspaceId) || !Number.isInteger(userId)) {
			return res.status(400).json({ error: 'Invalid workspaceId or userId' });
		}

		const shifts = await prisma.shift.findMany({
			where: {
				workspaceId,
				userId
			},
			orderBy: {
				startTime: 'asc'
			}
		});
		return res.status(200).json({shifts});
	} catch (error) {
		console.error('Error fetching user shifts:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/:userId/memberships', async (req, res) => {
	// TODO: Implement get memberships by user
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:userId/role-memberships', async (req, res) => {
	// TODO: Implement get role memberships by user
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:userId/shift-requests', async (req, res) => {
	// TODO: Implement get shift requests by user
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement add member to workspace
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:userId', removeMember);

export default router;

