import { useAuth } from '@clerk/clerk-expo';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface Shift {
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
    user: {
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
}