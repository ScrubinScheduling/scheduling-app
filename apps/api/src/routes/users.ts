import express from 'express';
import { prisma } from '../db';
import { getUserByClerkId } from '../controllers/userController';

const router = express.Router();

router.get('/', async (req, res) => {
	// TODO: Implement get users
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get user
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement create user
	res.status(501).json({ error: 'Not implemented' });
});

router.patch('/:id', async (req, res) => {
	// TODO: Implement update user
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete user
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/by-clerk/:clerkId', getUserByClerkId);

export default router;

