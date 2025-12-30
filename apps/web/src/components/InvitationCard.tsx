"use client"
import React, { useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";
import { createApiClient } from "@scrubin/api-client";
import { InvitationInfo } from "@scrubin/schemas";



export default function InvitationCard({ workspaceName, workspaceOwnerName, workspaceOwnerEmail, invitationId }: InvitationInfo) {

    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();
    const router = useRouter();

	const apiClient = useMemo(
		() =>
			createApiClient({
				baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
				getToken,
			}),
		[getToken],
	);

    const clickHandler = async () => {
        setIsLoading(true);
        try {
            await apiClient.acceptInvitation(invitationId);
            router.push("/workspaces");
        } catch (error) {
            console.error("Something went wrong", error);
            setIsLoading(false);
        }
    }
    return (
        <div>
            <Card className="rounded-2xl shadow-lg p-4 space-y-2">
                <CardHeader className="mt-2">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="h-8 w-8 text-primary" />

                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <CardTitle className="text-2xl">You have been invited</CardTitle>
                        <CardDescription>Join the team and start collaborating</CardDescription>
                    </div>

                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex bg-muted rounded-lg p-4 gap-3 items-center">

                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <div className="text-xs font-medium block text-muted-foreground">WORKSPACE</div>
                            <div className="font-semibold block text-foreground truncate">{workspaceName}</div>
                        </div>


                    </div>

                    <div className="space-y-4">

                        <div className="text-xs font-medium block text-muted-foreground">INVITED BY</div>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                                <AvatarFallback>KA</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-foreground truncate">{workspaceOwnerName}</div>
                                <div className="text-xs font-medium text-muted-foreground truncate">{workspaceOwnerEmail}</div>
                            </div>

                        </div>
                    </div>

                    <div className="h-px bg-border" />
                    <Button onClick={clickHandler} disabled={isLoading} className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground transition-colors duration-200 hover:cursor-pointer hover:bg-primary/90">
                        {isLoading && <Spinner className="text-primary-foreground" />}
                        Accept
                    </Button>
                </CardContent>
                <CardFooter>
                    <p className="w-full text-xs text-center text-muted-foreground">This invitation expires in 1 day</p>
                </CardFooter>
            </Card>
        </div>


    );
}