import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function atLocalDate(hour: number, minute = 0, daysFromNow = 0) {
	const d = new Date()
	d.setHours(0, 0, 0, 0)
	d.setDate(d.getDate() + daysFromNow)
	d.setHours(hour, minute, 0, 0)
	return d
}

async function clearAllDataExceptUsers() {
	console.log('Clearing all data except users...')

	// Delete in order respecting foreign key constraints
	await prisma.meetingInvite.deleteMany()
	await prisma.meeting.deleteMany()
	await prisma.shiftRequest.deleteMany()
	await prisma.timeOffRequest.deleteMany()
	await prisma.timesheet.deleteMany()
	await prisma.shift.deleteMany()
	await prisma.userRoleMembership.deleteMany()
	await prisma.role.deleteMany()
	await prisma.userWorkspaceMembership.deleteMany()
	await prisma.invitation.deleteMany()
	await prisma.workspace.deleteMany()

	console.log('Cleared all data except users and permissions')
}

async function ensureDemoWorkspaceWithUsers() {
	// Grab all users (up to 5) to participate in demo data
	const users = await prisma.user.findMany({
		orderBy: { createdAt: 'asc' },
		take: 5,
	})
	if (users.length < 2) {
		console.warn('Fewer than 2 users in DB; cannot seed demo workspace/memberships.')
		return null
	}

	console.log(`Found ${users.length} users to seed with`)

	// Create a demo workspace
	const workspace = await prisma.workspace.create({
		data: {
			name: 'Demo Workspace',
			location: 'HQ',
			adminId: users[0].id,
		},
	})
	console.log(`Created workspace 'Demo Workspace' (id=${workspace.id})`)

	// Add all users as members of this workspace
	for (const u of users) {
		await prisma.userWorkspaceMembership.create({
			data: {
				workspaceId: workspace.id,
				userId: u.id,
			},
		})
	}
	console.log(`Added ${users.length} users to workspace`)

	return {
		workspaceId: workspace.id,
		userIds: users.map((u) => u.id),
	}
}

async function createPastShiftsAndTimesheetsForUsers({
	days = 5,
	startHour = 9,
	endHour = 17,
	breakMinutes = 30,
	workspaceId,
	userIds,
}: {
	days?: number
	startHour?: number
	endHour?: number
	breakMinutes?: number
	workspaceId: number
	userIds: string[]
}) {
	const now = new Date()
	console.log(
		`Seeding past shifts + timesheets for ${userIds.length} users in workspace ${workspaceId}`,
	)

	const shiftLengthMs = (endHour - startHour) * 60 * 60 * 1000
	const breakMs = breakMinutes * 60 * 1000

	let createdShifts = 0
	let createdTimesheets = 0

	for (const userId of userIds) {
		for (let i = 1; i <= days; i++) {
			const startTime = atLocalDate(startHour, 0, -i)
			const endTime = atLocalDate(endHour, 0, -i)
			if (endTime >= now) continue

			// Avoid overlapping duplicate shifts if re-running
			const conflict = await prisma.shift.findFirst({
				where: {
					userId,
					workspaceId,
					startTime: { lt: endTime },
					endTime: { gt: startTime },
				},
				select: { id: true },
			})
			if (conflict) {
				continue
			}

			const shift = await prisma.shift.create({
				data: {
					userId,
					workspaceId,
					startTime,
					endTime,
					breakDuration: breakMinutes,
				},
				select: { id: true, startTime: true, endTime: true },
			})
			createdShifts++

			// Construct plausible timesheet around the shift
			// clock-in a few minutes after start, clock-out a few minutes before end
			const clockInTime = new Date(shift.startTime.getTime() + 2 * 60 * 1000)
			const clockOutTime = new Date(shift.endTime.getTime() - 3 * 60 * 1000)

			const midOfShift = new Date(shift.startTime.getTime() + shiftLengthMs / 2)
			const startBreakTime = new Date(midOfShift.getTime() - breakMs / 2)
			const endBreakTime = new Date(startBreakTime.getTime() + breakMs)

			await prisma.timesheet.create({
				data: {
					shiftId: shift.id,
					clockInTime,
					startBreakTime,
					endBreakTime,
					clockOutTime,
				},
			})
			createdTimesheets++
		}
	}

	console.log(
		`Created ${createdShifts} past shifts and ${createdTimesheets} timesheets`,
	)
	return { createdShifts, createdTimesheets }
}

async function createFutureShiftsForAllMemberships({
	days = 5,
	startHour = 9,
	endHour = 17,
	breakMinutes = 30,
}: {
	days?: number
	startHour?: number
	endHour?: number
	breakMinutes?: number
}) {
	const now = new Date()
	console.log(`Seeding future shifts (now = ${now.toISOString()})`)

	// Fetch all user-workspace memberships so shifts can be created with proper workspace scope
	const memberships = await prisma.userWorkspaceMembership.findMany({
		select: { userId: true, workspaceId: true },
	})
	if (memberships.length === 0) {
		console.warn('No user-workspace memberships found. Skipping shift creation.')
		return { created: 0 }
	}

	let created = 0

	for (const m of memberships) {
		for (let i = 1; i <= days; i++) {
			const startTime = atLocalDate(startHour, 0, i) // start from tomorrow
			const endTime = atLocalDate(endHour, 0, i)

			// Ensure strictly in the future
			if (startTime <= now) continue
			if (endTime <= startTime) continue

			// Avoid overlap with existing shifts for this user in this workspace
			const conflict = await prisma.shift.findFirst({
				where: {
					userId: m.userId,
					workspaceId: m.workspaceId,
					startTime: { lt: endTime },
					endTime: { gt: startTime },
				},
				select: { id: true },
			})
			if (conflict) {
				console.log(
					`Skip overlap user=${m.userId} workspace=${m.workspaceId} day+${i} (${startTime.toISOString()} - ${endTime.toISOString()})`,
				)
				continue
			}

			await prisma.shift.create({
				data: {
					userId: m.userId,
					workspaceId: m.workspaceId,
					startTime,
					endTime,
					breakDuration: breakMinutes,
				},
			})
			created++
		}
	}

	console.log(`Created ${created} future shifts across ${memberships.length} memberships`)
	return { created }
}

async function main() {
	// Clear all existing data except users
	await clearAllDataExceptUsers()

	// Ensure we have a workspace with users to anchor demo data
	const demo = await ensureDemoWorkspaceWithUsers()
	if (demo) {
		await createPastShiftsAndTimesheetsForUsers({
			days: 7, // last 7 days
			startHour: 9,
			endHour: 17,
			breakMinutes: 30,
			workspaceId: demo.workspaceId,
			userIds: demo.userIds,
		})
	}

	await createFutureShiftsForAllMemberships({
		days: 7, // next 7 days
		startHour: 9,
		endHour: 17,
		breakMinutes: 30,
	})

	// After creating shifts, create sample cover and trade requests
	await createSampleShiftRequests()
}

main()
	.catch((e) => {
		console.error(e)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// ----- helpers to create shift requests -----
async function createSampleShiftRequests() {
	const now = new Date()

	type ShiftRow = {
		id: number
		userId: string
		workspaceId: number
		startTime: Date
	}

	const shifts: ShiftRow[] = await prisma.shift.findMany({
		where: { startTime: { gt: now } },
		select: { id: true, userId: true, workspaceId: true, startTime: true },
		orderBy: { startTime: 'asc' },
	})

	if (shifts.length === 0) {
		console.warn('No future shifts found. Skipping shift requests.')
		return
	}

	// Group shifts by workspace then by user
	const shiftsByWorkspace = new Map<number, Map<string, ShiftRow[]>>()
	for (const s of shifts) {
		let byUser = shiftsByWorkspace.get(s.workspaceId)
		if (!byUser) {
			byUser = new Map<string, ShiftRow[]>()
			shiftsByWorkspace.set(s.workspaceId, byUser)
		}
		const list = byUser.get(s.userId) ?? []
		list.push(s)
		byUser.set(s.userId, list)
	}

	let created = 0

	for (const [workspaceId, byUser] of shiftsByWorkspace.entries()) {
		const userIds = Array.from(byUser.keys())
		if (userIds.length < 2) {
			continue
		}

		// Sort each user's shifts by start time
		for (const userId of userIds) {
			const userShifts = byUser.get(userId) ?? []
			userShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
			byUser.set(userId, userShifts)
		}

		// Create shift requests between multiple user pairs
		// User 0 -> User 1: Cover request
		// User 1 -> User 2: Trade request
		// User 2 -> User 3: Cover request
		// User 3 -> User 4: Trade request
		// User 4 -> User 0: Cover request (circular)
		
		for (let i = 0; i < userIds.length; i++) {
			const requestor = userIds[i]
			const requested = userIds[(i + 1) % userIds.length]
			
			const requestorShifts = byUser.get(requestor) ?? []
			const requestedShifts = byUser.get(requested) ?? []
			
			if (requestorShifts.length === 0 || requestedShifts.length === 0) continue

			// Alternate between cover and trade requests
			if (i % 2 === 0) {
				// Cover request: requestor asks requested to cover their shift
				await prisma.shiftRequest.create({
					data: {
						requestorId: requestor,
						requestedUserId: requested,
						workspaceId,
						lendedShiftId: requestorShifts[0].id,
						requestedShiftId: null,
						approvedByRequested: 'PENDING',
						approvedByManager: 'PENDING',
					},
				})
				created++
			} else {
				// Trade request: requestor wants to trade their shift for requested's shift
				await prisma.shiftRequest.create({
					data: {
						requestorId: requestor,
						requestedUserId: requested,
						workspaceId,
						lendedShiftId: requestorShifts[0].id,
						requestedShiftId: requestedShifts[0].id,
						approvedByRequested: 'PENDING',
						approvedByManager: 'PENDING',
					},
				})
				created++
			}

			// If user has multiple shifts, create a second request using a different shift
			if (requestorShifts.length > 1) {
				await prisma.shiftRequest.create({
					data: {
						requestorId: requestor,
						requestedUserId: requested,
						workspaceId,
						lendedShiftId: requestorShifts[1].id,
						requestedShiftId: i % 2 === 0 ? requestedShifts[0]?.id ?? null : null,
						approvedByRequested: 'PENDING',
						approvedByManager: 'PENDING',
					},
				})
				created++
			}
		}
	}

	console.log(`Created ${created} sample shift requests`)
}
