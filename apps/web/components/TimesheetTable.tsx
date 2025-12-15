"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInMinutes, format } from "date-fns";
import React, { useState, useMemo } from "react";
import { formatDurationHM } from "../helpers/time";
import { Timesheet } from "@scrubin/schemas";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { createApiClient } from "@scrubin/api-client";
import { useAuth } from "@clerk/nextjs";

export default function TimesheetTable({ timesheets }: { timesheets: Timesheet[] }) {
    const { getToken } = useAuth();
    const { id: workspaceId } = useParams<{ id: string }>();
    const router = useRouter();
    
    const apiClient = useMemo(
        () =>
            createApiClient({
                baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
                getToken,
            }),
        [getToken]
    );

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{
        clockInTime: string;
        clockOutTime: string;
        startBreakTime: string;
        endBreakTime: string;
    }>({
        clockInTime: "",
        clockOutTime: "",
        startBreakTime: "",
        endBreakTime: "",
    });
    const [saving, setSaving] = useState(false);

    const formatTimesheetWorkDuration = (timesheet: Timesheet) => {
        if (!timesheet.clockInTime || !timesheet.clockOutTime) return ""

        const breakDuration = (timesheet.startBreakTime && timesheet.endBreakTime) ?
        differenceInMinutes(new Date(timesheet.endBreakTime), new Date(timesheet.startBreakTime)) : 0;

        return formatDurationHM(new Date(timesheet.clockInTime), new Date(timesheet.clockOutTime), breakDuration);
    }

    const formatDateTimeForInput = (dateStr: string | null) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return format(date, "yyyy-MM-dd'T'HH:mm");
    };

    const handleEdit = (timesheet: Timesheet) => {
        setEditingId(timesheet.id);
        setEditValues({
            clockInTime: formatDateTimeForInput(timesheet.clockInTime),
            clockOutTime: formatDateTimeForInput(timesheet.clockOutTime),
            startBreakTime: formatDateTimeForInput(timesheet.startBreakTime),
            endBreakTime: formatDateTimeForInput(timesheet.endBreakTime),
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues({
            clockInTime: "",
            clockOutTime: "",
            startBreakTime: "",
            endBreakTime: "",
        });
    };

    const handleSave = async (timesheetId: number) => {
        try {
            setSaving(true);

            const updateData: any = {};
            
            // Only send fields that have values
            if (editValues.clockInTime) {
                updateData.clockInTime = new Date(editValues.clockInTime).toISOString();
            } else {
                updateData.clockInTime = null;
            }
            
            if (editValues.clockOutTime) {
                updateData.clockOutTime = new Date(editValues.clockOutTime).toISOString();
            } else {
                updateData.clockOutTime = null;
            }
            
            if (editValues.startBreakTime) {
                updateData.startBreakTime = new Date(editValues.startBreakTime).toISOString();
            } else {
                updateData.startBreakTime = null;
            }
            
            if (editValues.endBreakTime) {
                updateData.endBreakTime = new Date(editValues.endBreakTime).toISOString();
            } else {
                updateData.endBreakTime = null;
            }

            await apiClient.updateTimesheet(workspaceId, timesheetId, updateData);
            
            toast.success("Timesheet updated successfully");
            setEditingId(null);
            router.refresh(); // Refresh server component data
        } catch (error) {
            console.error("Failed to update timesheet:", error);
            toast.error("Failed to update timesheet");
        } finally {
            setSaving(false);
        }
    };

    if (!timesheets || timesheets.length === 0) {
        return (
            <div className="mt-4 rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">No timesheets found.</p>
            </div>
        );
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
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {timesheets.map((timesheet: Timesheet) => {
                    const isEditing = editingId === timesheet.id;

                    return (
                        <TableRow key={timesheet.id}>
                            <TableCell>
                                {new Date(timesheet.shift.startTime).toLocaleDateString()}
                            </TableCell>
                            
                            <TableCell>
                                {isEditing ? (
                                    <Input
                                        type="datetime-local"
                                        value={editValues.clockInTime}
                                        onChange={(e) =>
                                            setEditValues((prev) => ({
                                                ...prev,
                                                clockInTime: e.target.value,
                                            }))
                                        }
                                        className="max-w-[200px]"
                                    />
                                ) : (
                                    timesheet.clockInTime ? format(new Date(timesheet.clockInTime), "hh:mm a") : "_ _"
                                )}
                            </TableCell>

                            <TableCell>
                                {isEditing ? (
                                    <Input
                                        type="datetime-local"
                                        value={editValues.startBreakTime}
                                        onChange={(e) =>
                                            setEditValues((prev) => ({
                                                ...prev,
                                                startBreakTime: e.target.value,
                                            }))
                                        }
                                        className="max-w-[200px]"
                                    />
                                ) : (
                                    timesheet.startBreakTime ? format(new Date(timesheet.startBreakTime), "hh:mm a") : "_ _"
                                )}
                            </TableCell>

                            <TableCell>
                                {isEditing ? (
                                    <Input
                                        type="datetime-local"
                                        value={editValues.endBreakTime}
                                        onChange={(e) =>
                                            setEditValues((prev) => ({
                                                ...prev,
                                                endBreakTime: e.target.value,
                                            }))
                                        }
                                        className="max-w-[200px]"
                                    />
                                ) : (
                                    timesheet.endBreakTime ? format(new Date(timesheet.endBreakTime), "hh:mm a") : "_ _"
                                )}
                            </TableCell>

                            <TableCell>
                                {isEditing ? (
                                    <Input
                                        type="datetime-local"
                                        value={editValues.clockOutTime}
                                        onChange={(e) =>
                                            setEditValues((prev) => ({
                                                ...prev,
                                                clockOutTime: e.target.value,
                                            }))
                                        }
                                        className="max-w-[200px]"
                                    />
                                ) : (
                                    timesheet.clockOutTime ? format(new Date(timesheet.clockOutTime), "hh:mm a") : "_ _"
                                )}
                            </TableCell>

                            <TableCell>
                                {formatTimesheetWorkDuration(timesheet)}
                            </TableCell>

                            <TableCell className="text-right">
                                {isEditing ? (
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(timesheet.id)}
                                            disabled={saving}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Save className="h-4 w-4 mr-1" />
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(timesheet)}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}