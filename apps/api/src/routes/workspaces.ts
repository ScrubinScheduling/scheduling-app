import express from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../db';
import { getWorkspaceMembership } from '../utils/authz';

const router = express.Router();

router.get('/', async (req, res) => {
	const { userId } = getAuth(req);

	const user = await prisma.user.findFirst({
		where: {
			clerkId: userId,
		},
	});

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const workspaces = await prisma.workspace.findMany({
		where: {
			memberships: { some: { user } },
		},
	});

	res.status(200).json(workspaces);
});

router.get('/:id', async (req, res) => {
	try {
		const { userId } = getAuth(req);
		const membership = await getWorkspaceMembership(userId, Number(req.params.id));

		if (!membership) {
			return res.status(403).json({ error: 'Unauthorized to Access Workspace' });
		}

		res.status(200).json(membership.workspace);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err });
	}
});

router.post('/', async (req, res) => {
	const { userId } = getAuth(req);

	const user = await prisma.user.findFirst({
		where: {
			clerkId: userId,
		},
	});

	if (!user) {
		return res.status(404).json({ error: 'User not found in db' });
	}

	const workspace = await prisma.workspace.create({
		data: {
			name: req.body.name,
			adminId: user.id,
			location: req.body.location,
			memberships: {
				create: [{ user: { connect: { id: user.id } } }],
			},
		},
	});

	res.status(200).json(workspace);
});

router.patch('/:id', async (req, res) => {
	// TODO: Implement workspace update
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement workspace delete
	res.status(501).json({ error: 'Not implemented' });
});

export default router;

