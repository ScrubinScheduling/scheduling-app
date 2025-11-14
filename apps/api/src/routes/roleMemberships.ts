import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get role memberships by workspace
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get role membership
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement create role membership
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete role membership
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

