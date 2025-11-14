import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get memberships by workspace
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get membership
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement create membership
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete membership
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

