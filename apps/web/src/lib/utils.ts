import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MeetingStatus } from "@scrubin/schemas";
import { Dayjs } from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapStatusChip(status: MeetingStatus) {
	const map: Record<MeetingStatus, string> = {
		PENDING: "bg-yellow-100 text-yellow-800",
		FINALIZED: "bg-green-200 text-green-800",
		CANCELLED: "bg-red-200 text-red-800",
		RESCHEDULED: "bg-purple-200 text-purple-800",
	};
	return map[status];
}

export function dateTimeToISO(date: Date | null, time: Dayjs | null): string | null {
	if (!date || !time) return null;

	const hour = time.hour();
	const minute = time.minute();

	const year = date.getUTCFullYear();
	const month = date.getUTCMonth(); // 0-based
	const day = date.getUTCDate();

	// Construct as UTC so the stored time is exactly what the user picked
	const d = new Date(Date.UTC(year, month, day, hour, minute, 0));
	return d.toISOString();
}