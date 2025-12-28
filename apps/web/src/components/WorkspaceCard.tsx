"use client";
import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation";
import type { Workspace } from "@scrubin/schemas";

export default function WorkspaceCard({ workspace }: {workspace: Workspace}) {
    const router = useRouter();

    return (
        <Card className="hover:bg-gray-50 hover:cursor-pointer" onClick={() => router.push(`/workspaces/${workspace.id}`)}>
            <CardHeader className="flex items-center justify-between">
                <CardTitle>{workspace.name}</CardTitle>
            </CardHeader>

        </Card >
    );

}