import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get workspace members
	res.status(501).json({ error: 'Not implemented' });
});

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

router.delete('/:userId', async (req, res) => {
	// TODO: Implement remove member from workspace
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

