"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import WorkspaceList from "../../../components/WorkspaceList";
import { useAuth, UserButton } from "@clerk/nextjs";

import { createApiClient } from "@scrubin/api-client";
import type { Workspace } from "@scrubin/schemas";
import { useSSEStream } from "@/hooks/useSSE";

export default function Page() {


    const { getToken } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

    const apiClient = useMemo( () =>
        createApiClient({
            baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
            getToken,
        }),[getToken]);

    const fetchWorkspaces = useCallback(async() => {
        try {
            const list  = await apiClient.getWorkspaces();
            setWorkspaces(list)
        } catch (error) {
            console.log("Unable to fetch workspaces", error);
        }
    }, [apiClient])
    

    useEffect(() => {
        fetchWorkspaces(); 
    }, [fetchWorkspaces]);

    const workspaceHandlers = useMemo(
        () => ({
            'workspace-created': () => {
                fetchWorkspaces();
            }
        }), [fetchWorkspaces]
    );

    useSSEStream(null, workspaceHandlers); 


    

    
    return (
        <div>
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="font-semibold">Scrubin</div>
                    <UserButton />
                </div>
            </nav>
            <main className="min-h-screen flex flex-col bg-white">

                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        <h1 className="mb-8 text-center text-3xl font-semibold">Workspaces</h1>
                        <WorkspaceList workspaces={workspaces ?? []} />
                    </div>
                </div>

            </main>
        </div>

    );
}