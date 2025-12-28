import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MeetingStatus } from "@scrubin/schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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