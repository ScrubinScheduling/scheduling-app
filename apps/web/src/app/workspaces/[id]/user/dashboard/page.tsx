import React from "react";
import ClockinCard from "../../../../../../components/ClockinCard";

export default function Page() {
    return (
        <main className="min-h-screen bg-card px-6 py-8">
            <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-semibold mb-6">Overview</h1>
                <p className="text-lg text-muted-foreground font-medium">Manage your shifts, breaks, and schedule.</p>
                <div className="space-y-4">
                    <ClockinCard/>
                </div>
            </div>
        </main>
    )
}