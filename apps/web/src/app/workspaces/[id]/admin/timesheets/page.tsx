import React from "react";
import { getServerApiClient } from "@/lib/apiClient";
import UserSelect from "../../../../../../components/UserSelect";
import TimesheetTable from "../../../../../../components/TimesheetTable";

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | null> }) {
    const apiClient = await getServerApiClient()

    const { userId } = searchParams;
    const { id: workspaceId } = params;
    const { members: users } = await apiClient.getWorkspaceMembers(workspaceId);
    const selectedUserId = userId ?? undefined as string | undefined;

    const timesheets = selectedUserId && await apiClient.getUserTimesheets(workspaceId, selectedUserId);

    return (
        <main className="min-h-screen bg-card px-6 py-8">
            <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-semibold mb-6">Timesheet Management</h1>
                <p className="text-lg text-muted-foreground font-medium">Track employee clock in and clock out times</p>
                <div className="space-y-4">
                    <UserSelect users={users} selectedUserId={selectedUserId} />
                    <TimesheetTable timesheets={timesheets} />
                </div>
            </div>
        </main>);
}