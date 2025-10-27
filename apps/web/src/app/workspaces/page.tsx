import React from "react";
import WorkspaceList from "../../../components/WorkspaceList";
import { UserButton } from "@clerk/nextjs";

export default function Page() {
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
                        <WorkspaceList workspaces={["l", "a", "b"]} />
                    </div>
                </div>

            </main>
        </div>

    );
}