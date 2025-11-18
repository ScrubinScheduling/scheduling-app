import express from 'express';
import { prisma } from '../db';

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

// get shifts from a user given ther userId and optional start and end date query parameters
router.get('/:id/shifts', async (req, res) => {
	try {
		const userId = Number(req.params.id);
		const { start, end } = req.query;

		// check if valid user
		if (!Number.isInteger(userId)) {
			return res.status(400).json({ error: 'Invalid userId' });
		}
		
		const where: any = { userId };
		if (start && end) {
			const startDate = new Date(start as string);
			const endDate = new Date(end as string);
			where.startTime = { gte: startDate, lt: endDate };
		}

		const shifts = await prisma.shift.findMany({
			where,
			orderBy: {
				startTime: 'asc'
			},
			include: {
				user: true,
				workspace: true
			}
		});

		res.status(200).json({ shifts });
	} catch (error) {
		console.error('Error fetching user shifts:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});


// Get the current authenticated user
router.get('/current', async (req, res) => {
	try {
		const { userId } = req.auth;
		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// if user found
		const user = await prisma.user.findUnique({
			where: { clerkId: userId }
			include: {
				UserWorkspaceMembership: {
					include: {
						workspace: true
					}
				}
			}
		});

		// if not found
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json(user);
	} catch (error) {
		console.error('Error fetching current user:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;

