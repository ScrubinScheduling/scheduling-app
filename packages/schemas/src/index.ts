// Shared application DTO types
import * as z from 'zod';

<<<<<<< HEAD

=======
export type Timesheet = {
  id: number;
  clockInTime: string | null;
  clockOutTime: string | null;
  startBreakTime: string | null;
  endBreakTime: string | null;
  shift: {
    id: number;
    startTime: string;
    endTime: string;
    breakDuration: number | null;
    user?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  };
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
>>>>>>> refactor/adminDashboard

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

<<<<<<< HEAD
=======
export type Member = {
  userId: string;
  id: string;
  membershipId: number;
  role: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
};

>>>>>>> refactor/adminDashboard
export type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
};

// yyyy-MM-dd (used as a stable key for calendar buckets)
export type DayKey = string;

// Shape returned by `GET /workspaces/:id/shifts` for a given time window (month grid, day, etc.)
export type WorkspaceMonthlySchedule = {
  days: DayKey[];
  users: User[];
  buckets: Record<User['id'], Record<DayKey, Shift[]>>;
};

export const emptyWorkspaceMonthlySchedule: WorkspaceMonthlySchedule = {
  days: [],
  users: [],
  buckets: {}
};


export type UserShiftsResponseLegacy = {
  shifts: ShiftLegacy[];
};


export type MeetingStatus = "PENDING" | "FINALIZED" | "CANCELLED" | "RESCHEDULED";
const WorkspaceSchema = z.object({
	id: z.number(),
	name: z.string(),
	adminId: z.string(),
	location: z.string()
});
export type Workspace = z.infer<typeof WorkspaceSchema>;
export const WorkspacesSchema = z.array(WorkspaceSchema);
export type Workspaces = z.infer<typeof WorkspacesSchema>;

const InvitationInfoSchema = z.object({
	workspaceName: z.string(),
	workspaceOwnerName: z.string(),
	workspaceOwnerEmail: z.email(),
	invitationId: z.string(),
});
export type InvitationInfo = z.infer<typeof InvitationInfoSchema>;
export const InvitationInfosSchema = z.array(InvitationInfoSchema);
export type InvitationInfos = z.infer<typeof InvitationInfoSchema>;

const ShiftSchema = z.object({
	id: z.number(),
	startTime: z.string(),
	endTime: z.string(),
	breakDuration: z.number().default(0),
	userId: z.string(),
	workspaceId: z.number()
});
export type Shift = z.infer<typeof ShiftSchema>;
export const ShiftsSchema = z.array(ShiftSchema);
export type Shifts = z.infer<typeof ShiftSchema>;

const TimesheetSchema = z.object({
	id: z.number(),
    clockInTime: z.string().nullable(),
    clockOutTime: z.string().nullable(),
    startBreakTime: z.string().nullable(),
    endBreakTime: z.string().nullable(),
    shift: z.object({
        id: z.number(),
        startTime: z.string(),
        endTime: z.string(),
        breakDuration: z.number().default(0),
        user: z.object({
            id: z.string(),
            firstName: z.string().nullable(),
            lastName: z.string().nullable()
        })
    })
});
export type Timesheet = z.infer<typeof TimesheetSchema>;
export const TimesheetsSchema = z.array(TimesheetSchema);
export type Timesheets = z.infer<typeof TimesheetSchema>;

const MeetingSchema = z.object({
	id: z.number(),
	location: z.string(),
	description: z.string(),
	date: z.string(),
	time: z.string(),
	status: z.enum(["PENDING", "FINALIZED", "CANCELLED", "RESCHEDULED"]),
	inviteMembershipIds: z.array(z.number()),
	createdById: z.string(),
	attendees: z.object({
		yes: z.array(z.string()),
		no: z.array(z.string()),
		pending: z.array(z.string())
	})
});

export type Meeting = z.infer<typeof MeetingSchema>;
export const MeetingsSchema = z.array(MeetingSchema);
export type Meetings = z.infer<typeof MeetingSchema>;


const MemberSchema = z.object({
  membershipId: z.number(),
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  email: z.string().optional(),
  phone: z.string(),
  roleId: z.string(),
  isAdmin: z.boolean(),
});

export type Member = z.infer<typeof MemberSchema>;
export const MembersSchema = z.array(MemberSchema);
export type Members = z.infer<typeof MemberSchema>;
