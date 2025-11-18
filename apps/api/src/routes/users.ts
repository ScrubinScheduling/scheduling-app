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

router.get('/:id/shifts', async (req, res) => {
	try {
		const userId = Number(req.params.id);
		const { start, end } = req.query;

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

export default router;

