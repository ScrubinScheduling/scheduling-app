"use client";
import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
export default function CreateWorkspaceCard() {
    const router = useRouter();

    return (
        <Card className="hover:bg-gray-50 hover:cursor-pointer border border-dashed" onClick={() => router.push('/dashboard')}>
            <CardHeader className="flex items-center">
                <Plus className="h-4 w-4 text-gray-600" />

                <span className="text-md font-medium text-gray-600 text-left">Create Workspace</span>
            </CardHeader>

        </Card >
    );

}