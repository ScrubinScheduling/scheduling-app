import express from 'express';
import { prisma } from '../db';
import { ShiftRequestStatus } from '../controllers/shiftRequestController';
import { getAuth } from '@clerk/express';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get shift requests by workspace
	try {
		const { workspaceId } = (req.params as { workspaceId: string });
		const { status } = req.query;

		// filter by workspaceId and optional status
		const where: any = { workspaceId: Number(workspaceId) };

		// Map status string to enum value
		if (status && typeof status === 'string') {
			const upper = status.toUpperCase();
			if (upper in ShiftRequestStatus) {
				where.status = ShiftRequestStatus[upper as keyof typeof ShiftRequestStatus];
			} else {
				return res.status(400).json({ error: 'Invalid status value' });
			}
		}

		// Query shift requests
		const shiftRequests = await prisma.shiftRequest.findMany({
			where,
			include: {
				requestor: true,
				workspace: true,
				lendedShift: true,
				requestedShift: true,
			},
			orderBy: { id: 'desc' },
		})
		
		res.status(200).json(shiftRequests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to fetch shift requests' });
	}
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get shift request
	try {
		const { workspaceId, id } = (req.params as { workspaceId: string; id: string });

		const shiftRequest = await prisma.shiftRequest.findFirst({
			where: {
				id: Number(id),
				workspaceId: Number(workspaceId),
			},
			include: {
				requestor: true,
				workspace: true,
				lendedShift: true,
				requestedShift: true,
			},
		});

		if (!shiftRequest) {
			return res.status(404).json({ error: 'Shift request not found' });
		}

		res.status(200).json(shiftRequest);
	} catch (error) {
		console.error('Error fetching shift request:', error);
		res.status(500).json({ error: 'Failed to fetch shift request' });
	}
});

router.post('/', async (req, res) => {
	// Implemented create shift request
	try {
		const { lendedShiftId, requestedShiftId } = req.body;
		const { workspaceId } = (req.params as { workspaceId: string });

		// Authenticated user from Clerk
		const { userId: clerkId } = getAuth(req);
		console.log('Clerk ID:', clerkId);
		const auth = getAuth(req);

		// Look up the correspoding user row in our database
		const requestingUser = await prisma.user.findUnique({
			where: { clerkId: clerkId || '' },
		});

		if (!requestingUser) {
			return res.status(404).json({ error: 'Requesting user not found' });
		}

		// Basic validation
		if (!lendedShiftId || !requestedShiftId) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Create the shift request
		const newShiftRequest = await prisma.shiftRequest.create({
			data: {
				requestorId: requestingUser.id,
				workspaceId: Number(workspaceId),
				lendedShiftId: Number(lendedShiftId),
				requestedShiftId: requestedShiftId ? Number(requestedShiftId) : null,
				status: ShiftRequestStatus.PENDING,
			},
		})

		res.status(201).json(newShiftRequest);
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: 'Failed to create shift request' });
	}
});

router.patch('/:id', async (req, res) => {
	// TODO: Implement update shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/approve', async (req, res) => {
	// TODO: Implement approve shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/reject', async (req, res) => {
	// TODO: Implement reject shift request
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

