import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInMinutes, format } from "date-fns";
import React from "react";
import { formatDurationHM } from "../helpers/time";

export default function TimesheetTable({ timesheets }) {
    const formatTimesheetWorkDuration = (timesheet) => {
        if (!timesheet.clockInTime || !timesheet.clockOutTime) return ""

        const breakDuration = (timesheet.startBreakTime && timesheet.endBreakTime) ?
        differenceInMinutes(timesheet.endBreakTime, timesheet.startBreakTime): 0;

        return formatDurationHM(timesheet.clockInTime, timesheet.clockOutTime, breakDuration);
    }
    return (
        <Table className="mt-4">
            <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Clock in</TableHead>
                    <TableHead className="font-semibold">Start Break</TableHead>
                    <TableHead className="font-semibold">End Break</TableHead>
                    <TableHead className="font-semibold">Clock out</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {timesheets && timesheets.map((timesheet) => {
                    <TableRow>
                        <TableCell>{timesheet.shift.startTime.toLocalDateString()}</TableCell>
                        <TableCell>{format(timesheet.clockInTime, "hh:mm a") ?? "_ _"}</TableCell>
                        <TableCell>{format(timesheet.startBreakTime, "hh:mm a") ?? "_ _"}</TableCell>
                        <TableCell>{format(timesheet.endBreakTime, "hh:mm a") ?? "_ _"}</TableCell>
                        <TableCell>{format(timesheet.clockOutTime, "hh:mm a") ?? "_ _"}</TableCell>
                        <TableCell>{formatTimesheetWorkDuration(timesheet)}</TableCell>
                    </TableRow>
                })}
            </TableBody>
        </Table>
    )
}
