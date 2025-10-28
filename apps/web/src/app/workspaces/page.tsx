"use client";
import React, { useEffect, useState } from "react";
import WorkspaceList from "../../../components/WorkspaceList";
import { useAuth, UserButton } from "@clerk/nextjs";
export default function Page() {

    const [workspaces, setWorkspaces] = useState([]);
    const { getToken } = useAuth();

    useEffect(() => {

        (async () => {
            const token = await getToken();

            const res = await fetch("http://localhost:4000/workspaces", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();


            setWorkspaces(data.workspaces)
        })();
    }, [])
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
                        <WorkspaceList workspaces={workspaces} />
                    </div>
                </div>

            </main>
        </div>

    );
}