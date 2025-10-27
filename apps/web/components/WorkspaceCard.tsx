"use client";
import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation";
export default function WorkspaceCard() {
    const router = useRouter();

    return (
        <Card className="hover:bg-gray-50 hover:cursor-pointer" onClick={() => router.push('/dashboard')}>
            <CardHeader className="flex items-center justify-between">
                <CardTitle>Card Title</CardTitle>
            </CardHeader>
           
        </Card >
    );

}