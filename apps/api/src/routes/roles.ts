import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get roles
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get role
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement create role
	res.status(501).json({ error: 'Not implemented' });
});

router.patch('/:id', async (req, res) => {
	// TODO: Implement update role
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete role
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:roleId/members', async (req, res) => {
	// TODO: Implement get role members
	res.status(501).json({ error: 'Not implemented' });
});

router.put('/:roleId/members/:userId', async (req, res) => {
	// TODO: Implement assign user to role
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:roleId/members/:userId', async (req, res) => {
	// TODO: Implement revoke user from role
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

