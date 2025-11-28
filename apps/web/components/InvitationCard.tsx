"use client"
import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Building2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { createApiClient } from "@scrubin/api-client";
import { InvitationInfo } from "@scrubin/schemas";



export default function InvitationCard({ workspaceName, workspaceOwnerName, workspaceOwnerEmail, invitationId }: InvitationInfo) {

    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    
    const apiClient = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
        getToken
    });

    const clickHandler = async () => {
        setIsLoading(true);
        try {
            await apiClient.acceptInvitation(invitationId);
            redirect("/workspaces");
        } catch (error) {
            console.error("Something went wrong", error);
            setIsLoading(false);
        }
    }
    return (
        <div>
            <Card className="bg-white rounded-2xl shadow-lg p-4 space-y-2">
                <CardHeader className="mt-2">
                    <div className="flex justify-center">
                        <div className="flex items-center justify-center bg-indigo-100 rounded-full h-16 w-16 ">
                            <CheckCircle2 className="text-indigo-600 w-8 h-8" />

                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <CardTitle className="text-2xl">You have been invited</CardTitle>
                        <CardDescription>Join the team and start collaborating</CardDescription>
                    </div>

                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex bg-slate-50 rounded-lg p-4 gap-3 items-center">

                        <div className="flex items-center justify-center rounded-lg h-12 w-12 bg-indigo-600 flex-shrink-0">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <div className="text-xs font-medium block text-slate-500">WORKSPACE</div>
                            <div className="font-semibold block text-slate-900 truncate">{workspaceName}</div>
                        </div>


                    </div>

                    <div className="space-y-4">

                        <div className="text-xs font-medium block text-slate-500">INVITED BY</div>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                                <AvatarFallback>KA</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-slate-900 truncate">{workspaceOwnerName}</div>
                                <div className="text-xs font-medium text-slate-500 truncate">{workspaceOwnerEmail}</div>
                            </div>

                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />
                    <Button onClick={clickHandler} disabled={isLoading} className="hover:cursor-pointer w-full bg-indigo-600 rounded-lg px-4 py-3 transition-colors duration-200">
                        {isLoading && <Spinner className="text-white" />}
                        <span className="text-white">Accept</span>
                    </Button>
                </CardContent>
                <CardFooter>
                    <p className="w-full text-xs text-center text-slate-400">This invitation expires in 1 day</p>
                </CardFooter>
            </Card>
        </div>


    );
}