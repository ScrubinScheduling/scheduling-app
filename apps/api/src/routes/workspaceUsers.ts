import express from 'express';
import { prisma } from '../db';
import { listMembers, removeMember } from '../controllers/memberController';

const router = express.Router({ mergeParams: true });

router.get('/', listMembers);

router.get('/:userId/shifts', async (req, res) => {
	// TODO: Implement get user shifts
	res.status(501).json({ error: 'Not implemented' });
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

