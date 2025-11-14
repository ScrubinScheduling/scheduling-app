import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	try {
		const workspaceId = Number(req.params.workspaceId);
		const { start, end } = req.query;

		if (!Number.isInteger(workspaceId)) {
			return res.status(400).json({ message: 'Invalid workspaceId' });
		}

		const where: any = { workspaceId };

		if (start && end) {
			const startDate = new Date(start as string);
			const endDate = new Date(end as string);
			where.startTime = { lt: endDate };
			where.endTime = { gt: startDate };
		}

		const shifts = await prisma.shift.findMany({
			where,
			orderBy: { startTime: 'asc' },
			include: { user: true },
		});

		res.status(200).json(shifts);
	} catch (error) {
		console.log('Error in shifts route', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get single shift
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/', async (req, res) => {
	// TODO: Implement create shift
	res.status(501).json({ error: 'Not implemented' });
});

router.patch('/:id', async (req, res) => {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid Id' });

		const shift = await prisma.shift.findUnique({ where: { id: id } });

		if (!shift) return res.status(404).json({ error: `shift: ${id} was not found` });

		const { startTime, endTime, userId, breakDuration } = req.body as {
			startTime?: string;
			endTime?: string;
			userId?: number;
			breakDuration?: number;
		};

		const updateData: any = {};
		if (startTime !== undefined) updateData.startTime = new Date(startTime);
		if (endTime !== undefined) updateData.endTime = new Date(endTime);
		if (breakDuration !== undefined) updateData.breakDuration = breakDuration;
		if (userId !== undefined) updateData.userId = userId;

		const updated = await prisma.shift.update({
			where: { id: id },
			data: updateData,
		});

		return res.status(200).json(updated);
	} catch (error) {
		console.log('Error in shifts route', error);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
		await prisma.shift.delete({ where: { id: Number(id) } });

		res.status(200).json({ message: 'Shift deleted' });
	} catch (err) {
		console.log('Error in shifts route', err);
		res.status(500).json({ message: 'Internal server error' });
	}
});

router.post('/:id/clock-in', async (req, res) => {
	// TODO: Implement clock in
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/clock-out', async (req, res) => {
	// TODO: Implement clock out
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/break/start', async (req, res) => {
	// TODO: Implement start break
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/break/end', async (req, res) => {
	// TODO: Implement end break
	res.status(501).json({ error: 'Not implemented' });
});

export default router;
