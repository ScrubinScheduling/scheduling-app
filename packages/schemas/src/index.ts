// Shared application DTO types
// Use as `import type { ShiftDto, TimesheetDto } from '@scrubin/schemas'`

export type Timesheet = {
	clockInTime: string | null;
	clockOutTime: string | null;
	startBreakTime: string | null;
	endBreakTime: string | null;
};

// Primary Shift DTO shape used by web UI (Timesheet is separate table, optionally included)
export type Shift = {
	id: number;
	startTime: string;
	endTime: string;
	breakDuration: number | null;
	userId?: string;
	workspaceId?: number;
	timesheet?: Timesheet | null;
};

// Legacy/mobile shape where clock/break fields live on the shift directly
// Keep for compatibility while mobile migrates to Timesheet
export type ShiftLegacy = {
	id: number;
	startTime: string;
	endTime: string;
	clockInTime: string | null;
	clockOutTime: string | null;
	startBreakTime: string | null;
	endBreakTime: string | null;
	breakDuration: number;
	userId: number;
	workspaceId: number;
	user?: {
		id: number;
		firstName: string | null;
		lastName: string | null;
		clerkId: string;
	};
	workspace?: {
		id: number;
		name: string;
		location: string;
	};
};

export type Member = {
	id: string; 
	membershipId: number; 
	role: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
};

export type User = {
	id: string;
	firstName: string;
	lastName?: string | null;
};

export type Workspace = {
	id: number;
	name: string;
	adminId: string;
	location: string;
};

export type InvitationInfo = {
	workspaceName: string;
	workspaceOwnerName: string;
	workspaceOwnerEmail: string;
	invitationId: string;
};

export type UserShiftsResponseLegacy = {
	shifts: ShiftLegacy[];
};
