import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
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