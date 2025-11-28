// /* eslint-disable no-console */
// import 'dotenv/config'
// import { PrismaClient, ApprovalStatus } from '@prisma/client'

// const prisma = new PrismaClient()

// type SeedWorkspaceInput = {
// 	name: string
// 	location: string
// 	userIds: number[] // users already exist; first one becomes admin
// }

// function dateAt(hour: number, minute = 0, daysFromNow = 0) {
// 	const d = new Date()
// 	d.setHours(0, 0, 0, 0)
// 	d.setDate(d.getDate() + daysFromNow)
// 	d.setHours(hour, minute, 0, 0)
// 	return d
// }

// async function seedWorkspace({
// 	name,
// 	location,
// 	userIds,
// }: SeedWorkspaceInput) {
// 	if (userIds.length < 2) {
// 		throw new Error('Need at least 2 users to seed a workspace')
// 	}
// 	const adminId = userIds[0]

// 	// Create workspace
// 	const workspace = await prisma.workspace.create({
// 		data: {
// 			name,
// 			location,
// 			adminId,
// 		},
// 	})
// 	console.log(`Created workspace '${workspace.name}' (id ${workspace.id})`)

// 	// Create roles
// 	const [adminRole, managerRole, memberRole] = await Promise.all([
// 		prisma.role.create({
// 			data: { workspaceId: workspace.id, name: 'Admin', permissions: 0 },
// 		}),
// 		prisma.role.create({
// 			data: { workspaceId: workspace.id, name: 'Manager', permissions: 0 },
// 		}),
// 		prisma.role.create({
// 			data: { workspaceId: workspace.id, name: 'Member', permissions: 0 },
// 		}),
// 	])
// 	console.log('Created roles: Admin, Manager, Member')

// 	// Add memberships (unique pair enforced)
// 	await prisma.userWorkspaceMembership.createMany({
// 		data: userIds.map((uid) => ({
// 			userId: uid,
// 			workspaceId: workspace.id,
// 		})),
// 		skipDuplicates: true,
// 	})
// 	console.log(`Added ${userIds.length} user workspace memberships`)

// 	// Role memberships
// 	const roleMembershipCreates = [
// 		{ userId: adminId, workSpaceId: workspace.id, roleId: adminRole.id },
// 		...(userIds.slice(1, 2).map((uid) => ({
// 			userId: uid,
// 			workSpaceId: workspace.id,
// 			roleId: managerRole.id,
// 		}))),
// 		...(userIds.slice(2).map((uid) => ({
// 			userId: uid,
// 			workSpaceId: workspace.id,
// 			roleId: memberRole.id,
// 		}))),
// 	]
// 	await prisma.userRoleMembership.createMany({
// 		data: roleMembershipCreates,
// 		skipDuplicates: true,
// 	})
// 	console.log(`Added ${roleMembershipCreates.length} user role memberships`)

// 	// Create shifts for each user (two days)
// 	const userIdToShiftIds = new Map<number, number[]>()
// 	for (const uid of userIds) {
// 		const s1 = await prisma.shift.create({
// 			data: {
// 				userId: uid,
// 				workspaceId: workspace.id,
// 				startTime: dateAt(9, 0, 1),
// 				endTime: dateAt(17, 0, 1),
// 				breakDuration: 0,
// 			},
// 		})
// 		const s2 = await prisma.shift.create({
// 			data: {
// 				userId: uid,
// 				workspaceId: workspace.id,
// 				startTime: dateAt(9, 0, 2),
// 				endTime: dateAt(17, 0, 2),
// 				breakDuration: 0,
// 			},
// 		})
// 		userIdToShiftIds.set(uid, [s1.id, s2.id])
// 	}
// 	console.log('Created shifts for users')

// 	// Create a time-off (cover) request:
// 	// userIds[1] asks userIds[2] to cover their shift on day 1
// 	if (userIds.length >= 3) {
// 		const requestorId = userIds[1]
// 		const requestedUserId = userIds[2]
// 		const lendedShiftId = userIdToShiftIds.get(requestorId)![0]
// 		await prisma.shiftRequest.create({
// 			data: {
// 				requestorId,
// 				requestedUserId,
// 				workspaceId: workspace.id,
// 				lendedShiftId,
// 				requestedShiftId: null,
// 				approvedByRequested: ApprovalStatus.PENDING,
// 				approvedByManager: null,
// 			},
// 		})
// 		console.log(
// 			`Created time-off request: user ${requestorId} -> user ${requestedUserId}`,
// 		)
// 	}

// 	// Create a trade request:
// 	// userIds[1] offers their day-2 shift for userIds[2]'s day-2 shift
// 	if (userIds.length >= 3) {
// 		const requestorId = userIds[1]
// 		const requestedUserId = userIds[2]
// 		const lendedShiftId = userIdToShiftIds.get(requestorId)![1]
// 		const requestedShiftId = userIdToShiftIds.get(requestedUserId)![1]
// 		await prisma.shiftRequest.create({
// 			data: {
// 				requestorId,
// 				requestedUserId,
// 				workspaceId: workspace.id,
// 				lendedShiftId,
// 				requestedShiftId,
// 				approvedByRequested: ApprovalStatus.PENDING,
// 				approvedByManager: null,
// 			},
// 		})
// 		console.log(
// 			`Created trade request between user ${requestorId} and user ${requestedUserId}`,
// 		)
// 	}

// 	return workspace
// }

// async function main() {
// 	// Fetch existing users (users are set in stone)
// 	const users = await prisma.user.findMany({
// 		orderBy: { id: 'asc' },
// 		take: 6,
// 	})
// 	if (users.length < 2) {
// 		throw new Error(
// 			'Seed requires at least 2 existing users in the database. Found ' +
// 				users.length,
// 		)
// 	}
// 	const userIds = users.map((u) => u.id)
// 	console.log(`Found ${userIds.length} users: [${userIds.join(', ')}]`)

// 	// Create one or two workspaces using existing users
// 	await seedWorkspace({
// 		name: `Seed Clinic A`,
// 		location: '123 Main St',
// 		userIds: userIds.slice(0, Math.min(4, userIds.length)),
// 	})
// 	await seedWorkspace({
// 		name: `Seed Clinic B`,
// 		location: '456 Oak Ave',
// 		userIds: userIds.slice(0, Math.min(3, userIds.length)),
// 	})
// }

// main()
// 	.catch((e) => {
// 		console.error(e)
// 		process.exitCode = 1
// 	})
// 	.finally(async () => {
// 		await prisma.$disconnect()
// 	})
