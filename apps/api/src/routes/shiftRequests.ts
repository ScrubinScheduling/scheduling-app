import express from 'express';
import { prisma } from '../db';
import { ShiftRequestStatus } from '../controllers/shiftRequestController';
import { getAuth } from '@clerk/express';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
	// TODO: Implement get shift requests by workspace
	res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', async (req, res) => {
	// TODO: Implement get shift request
	res.status(501).json({ error: 'Not implemented' });
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

