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

export interface UserShiftsResponse {
    shifts: Shift[];
}

// developed using ai
class ApiClient {
    private getToken: () => Promise<string | null>;
    constructor(getToken: () => Promise<string | null>) {
        this.getToken = getToken;
    }

    private async fetchWithAuth(url: string, options: RequestInit = {}) {
        const token = await this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    }

    // get the shifts for a user within an optional date range
    async getUserShifts(userId: number, startDate?: Date, endDate?: Date): Promise<Shift[]> {
        const params = new URLSearchParams();
        if (startDate) {
            params.append('start', startDate.toISOString());
        }
        if (endDate) {
            params.append('end', endDate.toISOString());
        }

        const url = `${API_URL}/users/${userId}/shifts?${params.toString()}`;
        return this.fetchWithAuth(url);
    }

    // get the current authenticated user
    async getCurrentUser(): Promise<any> {
        const url = `${API_URL}/users/current`;
        return this.fetchWithAuth(url);
    }
}

export function useApiClient() {
    const { getToken } = useAuth();
    return new ApiClient(getToken);
}